import type { Evaluation } from '../types/evaluation';
import type { EmployeeGoal } from '../types/goals';
import type {
  PerformanceAnalytics,
  RecommendationDecision,
  TrainingRecommendation,
  RecommendationCategory,
  RecommendationSeverity,
} from '../types/analytics';
import { buildPillarSummaries } from './scoring';

const INTERVENTION_CATALOG: Record<
  string,
  { title: string; actions: string[]; category: RecommendationCategory }
> = {
  functional_low: {
    category: 'functional',
    title: 'Role-skill deep dive',
    actions: [
      'Assign a targeted skills refresher for the lowest-scoring functional criteria',
      'Pair with a high performer for 2 weeks of shadowing',
      'Set a 30-day micro-goal with weekly manager check-ins',
    ],
  },
  interpersonal_low: {
    category: 'interpersonal',
    title: 'Communication & collaboration coaching',
    actions: [
      'Enrol in structured feedback / conflict-handling workshop',
      'Practice written communication templates with manager review',
      'Join a cross-team collaboration ritual for one quarter',
    ],
  },
  leadership_low: {
    category: 'leadership',
    title: 'Leadership pathway intervention',
    actions: [
      'Start a leadership micro-course (delegation, accountability, mentoring)',
      'Own a small initiative with mentor oversight',
      'Schedule bi-weekly coaching conversations with line manager',
    ],
  },
  overall_under: {
    category: 'general',
    title: 'Performance improvement plan (PIP advisory)',
    actions: [
      'Document clear 60-day success criteria aligned to framework pillars',
      'Increase review cadence to fortnightly',
      'Identify one training intervention per weak pillar',
    ],
  },
  gap_self_manager: {
    category: 'general',
    title: 'Calibration conversation',
    actions: [
      'Run a joint calibration session comparing self vs manager evidence',
      'Agree on observable behaviours for the next period',
      'Revisit goals to remove ambiguity',
    ],
  },
  goal_at_risk: {
    category: 'goal_alignment',
    title: 'Goal recovery sprint',
    actions: [
      'Break the at-risk goal into weekly milestones',
      'Remove blockers with manager or adjacent teams',
      'Re-link the goal progress update to the next evaluation cycle',
    ],
  },
};

function empName(e: Evaluation): string {
  return typeof e.employeeId === 'string'
    ? e.employeeId
    : `${e.employeeId.firstName} ${e.employeeId.lastName}`;
}

function empId(e: Evaluation): string {
  return typeof e.employeeId === 'string' ? e.employeeId : e.employeeId._id;
}

function empDept(e: Evaluation): string {
  return typeof e.employeeId === 'string' ? 'Unknown' : e.employeeId.department;
}

function severityFor(scorePct: number): RecommendationSeverity {
  if (scorePct < 40) return 'urgent';
  if (scorePct < 55) return 'watch';
  return 'info';
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/** Stable id so manager decisions survive analytics regeneration. */
export function recommendationFingerprint(
  employeeId: string,
  category: string,
  title: string
): string {
  return `${employeeId}::${category}::${slug(title)}`;
}

function makeRec(
  partial: Omit<TrainingRecommendation, '_id' | 'fingerprint' | 'generatedAt' | 'status'>
): TrainingRecommendation {
  const fingerprint = recommendationFingerprint(partial.employeeId, partial.category, partial.title);
  return {
    ...partial,
    fingerprint,
    _id: `rec-${fingerprint}`,
    status: 'suggested',
    generatedAt: new Date().toISOString(),
  };
}

/** Generate training-intervention recommendations from evaluations + goals. */
export function generateRecommendations(
  evaluations: Evaluation[],
  goals: EmployeeGoal[]
): TrainingRecommendation[] {
  const recs: TrainingRecommendation[] = [];
  const managerReviews = evaluations.filter(
    (e) => e.type === 'manager_review' && e.status !== 'draft' && e.percentScore > 0
  );

  for (const evaluation of managerReviews) {
    const id = empId(evaluation);
    const name = empName(evaluation);
    const dept = empDept(evaluation);
    const pillars = buildPillarSummaries(evaluation.frameworkSnapshot, evaluation.categoryResults, evaluation);

    if (evaluation.percentScore < 50) {
      const pack = INTERVENTION_CATALOG.overall_under;
      recs.push(
        makeRec({
          employeeId: id,
          employeeName: name,
          department: dept,
          category: pack.category,
          severity: severityFor(evaluation.percentScore),
          title: pack.title,
          rationale: `Overall score ${evaluation.percentScore.toFixed(0)}% falls in Needs Improvement / underperformance band for ${evaluation.period}.`,
          suggestedActions: pack.actions,
          scoreSignal: evaluation.percentScore,
        })
      );
    }

    for (const pillar of pillars) {
      if (pillar.key === 'goals') {
        const pct = pillar.maxMarks > 0 ? (pillar.earnedMarks / pillar.maxMarks) * 100 : 100;
        if (pct >= 55) continue;
        const pack = INTERVENTION_CATALOG.goal_at_risk;
        recs.push(
          makeRec({
            employeeId: id,
            employeeName: name,
            department: dept,
            category: pack.category,
            severity: severityFor(pct),
            title: `${pack.title} (KPI goals block)`,
            rationale: `Goal attainment scored ${pct.toFixed(0)}% (${pillar.earnedMarks.toFixed(1)}/${pillar.maxMarks}) in ${evaluation.period}.`,
            suggestedActions: pack.actions,
            scoreSignal: pct,
          })
        );
        continue;
      }
      const pct = pillar.maxMarks > 0 ? (pillar.earnedMarks / pillar.maxMarks) * 100 : 100;
      if (pct >= 55) continue;
      const key =
        pillar.key === 'functional'
          ? 'functional_low'
          : pillar.key === 'interpersonal'
            ? 'interpersonal_low'
            : 'leadership_low';
      const pack = INTERVENTION_CATALOG[key];
      recs.push(
        makeRec({
          employeeId: id,
          employeeName: name,
          department: dept,
          category: pack.category,
          severity: severityFor(pct),
          title: `${pack.title} (${pillar.label})`,
          rationale: `${pillar.label} scored ${pct.toFixed(0)}% (${pillar.earnedMarks.toFixed(1)}/${pillar.maxMarks}) in ${evaluation.period}.`,
          suggestedActions: pack.actions,
          scoreSignal: pct,
        })
      );
    }
  }

  // Self vs manager gap
  const byKey: Record<string, { manager?: Evaluation; self?: Evaluation }> = {};
  evaluations.forEach((e) => {
    const key = `${empId(e)}::${e.period}`;
    byKey[key] = byKey[key] ?? {};
    if (e.type === 'manager_review') byKey[key].manager = e;
    if (e.type === 'self_review') byKey[key].self = e;
  });
  Object.values(byKey).forEach((pair) => {
    if (!pair.manager || !pair.self) return;
    const gap = Math.abs(pair.manager.percentScore - pair.self.percentScore);
    if (gap <= 10) return;
    const pack = INTERVENTION_CATALOG.gap_self_manager;
    recs.push(
      makeRec({
        employeeId: empId(pair.manager),
        employeeName: empName(pair.manager),
        department: empDept(pair.manager),
        category: pack.category,
        severity: gap > 20 ? 'urgent' : 'watch',
        title: pack.title,
        rationale: `Self (${pair.self.percentScore.toFixed(0)}%) and manager (${pair.manager.percentScore.toFixed(0)}%) differ by ${gap.toFixed(0)} points in ${pair.manager.period}.`,
        suggestedActions: pack.actions,
        scoreSignal: gap,
      })
    );
  });

  // At-risk goals
  goals
    .filter((g) => g.status === 'at_risk' || (g.progressPct < 40 && g.status !== 'completed' && g.status !== 'cancelled'))
    .forEach((g) => {
      const pack = INTERVENTION_CATALOG.goal_at_risk;
      recs.push(
        makeRec({
          employeeId: g.employeeId,
          employeeName: g.employeeName ?? g.employeeId,
          department: '—',
          category: pack.category,
          severity: g.status === 'at_risk' ? 'urgent' : 'watch',
          title: pack.title,
          rationale: `Goal "${g.title}" is ${g.status.replace('_', ' ')} at ${g.progressPct}% progress.`,
          suggestedActions: pack.actions,
          relatedGoalIds: [g._id],
          scoreSignal: g.progressPct,
        })
      );
    });

  // Prefer urgent first, then watch
  const weight: Record<RecommendationSeverity, number> = { urgent: 0, watch: 1, info: 2 };
  return recs.sort((a, b) => weight[a.severity] - weight[b.severity]);
}

export function buildPerformanceAnalytics(
  evaluations: Evaluation[],
  goals: EmployeeGoal[]
): PerformanceAnalytics {
  const scored = evaluations.filter((e) => e.percentScore > 0 || e.items.some((i) => i.score > 0));
  const avgOverall =
    scored.length > 0 ? scored.reduce((s, e) => s + e.percentScore, 0) / scored.length : 0;

  const byDeptMap = evaluations.reduce<Record<string, { sum: number; count: number; atRisk: number }>>(
    (acc, e) => {
      const dept = empDept(e);
      acc[dept] = acc[dept] ?? { sum: 0, count: 0, atRisk: 0 };
      if (e.percentScore > 0) {
        acc[dept].sum += e.percentScore;
        acc[dept].count += 1;
        if (e.percentScore < 50) acc[dept].atRisk += 1;
      }
      return acc;
    },
    {}
  );

  const byDepartment = Object.entries(byDeptMap).map(([department, row]) => ({
    department,
    avgPercent: row.count ? row.sum / row.count : 0,
    evaluationCount: row.count,
    atRiskCount: row.atRisk,
  }));

  const pillarBuckets = new Map<string, { sum: number; count: number; low: number }>();
  evaluations
    .filter((e) => e.type === 'manager_review')
    .forEach((e) => {
      buildPillarSummaries(e.frameworkSnapshot, e.categoryResults, e).forEach((p) => {
        const pct = p.maxMarks > 0 ? (p.earnedMarks / p.maxMarks) * 100 : 0;
        const cur = pillarBuckets.get(p.label) ?? { sum: 0, count: 0, low: 0 };
        cur.sum += pct;
        cur.count += 1;
        if (pct < 55) cur.low += 1;
        pillarBuckets.set(p.label, cur);
      });
    });

  const byPillar = Array.from(pillarBuckets.entries()).map(([pillar, row]) => ({
    pillar,
    avgPercent: row.count ? row.sum / row.count : 0,
    lowScoreCount: row.low,
  }));

  const recommendations = generateRecommendations(evaluations, goals);
  const pendingAcknowledgements = evaluations.filter(
    (e) => e.type === 'manager_review' && e.status === 'submitted'
  ).length;

  let selfManagerGapCount = 0;
  const pairs: Record<string, { m?: Evaluation; s?: Evaluation }> = {};
  evaluations.forEach((e) => {
    const key = `${empId(e)}::${e.period}`;
    pairs[key] = pairs[key] ?? {};
    if (e.type === 'manager_review') pairs[key].m = e;
    if (e.type === 'self_review') pairs[key].s = e;
  });
  Object.values(pairs).forEach((p) => {
    if (p.m && p.s && Math.abs(p.m.percentScore - p.s.percentScore) > 10) selfManagerGapCount += 1;
  });

  const goalsOnTrack = goals.filter((g) => g.status === 'on_track' || g.status === 'completed').length;
  const goalsAtRisk = goals.filter((g) => g.status === 'at_risk' || g.progressPct < 40).length;

  const coachingInsights: string[] = [];
  if (avgOverall > 0) {
    coachingInsights.push(
      `Organisation average evaluation score is ${avgOverall.toFixed(0)}% across ${scored.length} scored review(s).`
    );
  }
  if (goalsAtRisk > 0) {
    coachingInsights.push(`${goalsAtRisk} goal(s) are at risk and need recovery interventions.`);
  }
  if (selfManagerGapCount > 0) {
    coachingInsights.push(
      `${selfManagerGapCount} employee period(s) show a large self vs manager score gap — schedule calibration.`
    );
  }
  const weakest = [...byPillar].sort((a, b) => a.avgPercent - b.avgPercent)[0];
  if (weakest && weakest.avgPercent > 0) {
    coachingInsights.push(
      `Weakest pillar overall: ${weakest.pillar} (${weakest.avgPercent.toFixed(0)}% avg) — prioritise related training.`
    );
  }
  if (recommendations.filter((r) => r.severity === 'urgent').length > 0) {
    coachingInsights.push(
      `${recommendations.filter((r) => r.severity === 'urgent').length} urgent training intervention(s) generated.`
    );
  }
  if (coachingInsights.length === 0) {
    coachingInsights.push('Not enough scored evaluations yet — insights appear once reviews are submitted.');
  }

  return {
    generatedAt: new Date().toISOString(),
    totalEvaluations: evaluations.length,
    avgOverallPercent: avgOverall,
    pendingAcknowledgements,
    selfManagerGapCount,
    goalsOnTrack,
    goalsAtRisk,
    goalsTotal: goals.length,
    byDepartment,
    byPillar,
    recommendations,
    coachingInsights,
  };
}

/** Overlay persisted manager decisions onto freshly generated candidates. */
export function applyRecommendationDecisions(
  recommendations: TrainingRecommendation[],
  decisions: Record<string, RecommendationDecision>
): TrainingRecommendation[] {
  return recommendations.map((rec) => {
    const decision = decisions[rec.fingerprint];
    if (!decision) return rec;
    return {
      ...rec,
      status: decision.status,
      suggestedActions: decision.suggestedActions ?? rec.suggestedActions,
      dueDate: decision.dueDate,
      notes: decision.notes,
      dismissReason: decision.dismissReason,
      decidedBy: decision.decidedBy,
      decidedAt: decision.decidedAt,
    };
  });
}
