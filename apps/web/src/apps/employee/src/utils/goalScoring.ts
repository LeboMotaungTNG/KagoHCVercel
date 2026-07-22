import type { EmployeeGoal } from '../types/goals';
import type { GoalResult, SnapshotGoal } from '../types/evaluation';

/** Goals contribute 20 of the KPI total; criteria max varies by framework (each criterion = 5). */
export const GOALS_MAX_MARKS = 20;
/** Typical two-block framework: Functional 30 + Interpersonal 30 + Leadership 30. */
export const FRAMEWORK_CRITERIA_MAX = 90;

/**
 * Snapshot employee goals for an evaluation period.
 * Cancelled goals are excluded. Weights split equally across remaining goals.
 */
export function buildGoalSnapshot(
  goals: EmployeeGoal[],
  period: string,
  objectivesById?: Map<string, { title: string }>
): SnapshotGoal[] {
  const active = goals.filter((g) => {
    if (g.status === 'cancelled') return false;
    const matchesPeriod = g.evaluationPeriod === period || g.period === period;
    return matchesPeriod;
  });

  if (active.length === 0) return [];

  const base = Math.floor((GOALS_MAX_MARKS / active.length) * 10) / 10;
  let allocated = 0;
  return active.map((g, index) => {
    const isLast = index === active.length - 1;
    const maxMarks = isLast ? Math.round((GOALS_MAX_MARKS - allocated) * 10) / 10 : base;
    allocated += maxMarks;
    const progress =
      g.status === 'completed' ? 100 : Math.min(100, Math.max(0, g.progressPct));
    return {
      goalId: g._id,
      title: g.title,
      objectiveId: g.objectiveId,
      objectiveTitle: objectivesById?.get(g.objectiveId)?.title,
      maxMarks,
      progressPct: progress,
      assessedProgressPct: progress,
      status: g.status,
    };
  });
}

export function scoreGoalSnapshot(goals: SnapshotGoal[]): {
  goalResults: GoalResult[];
  goalsEarnedMarks: number;
  goalsMaxMarks: number;
} {
  if (goals.length === 0) {
    return { goalResults: [], goalsEarnedMarks: 0, goalsMaxMarks: GOALS_MAX_MARKS };
  }

  const goalResults: GoalResult[] = goals.map((g) => {
    const pct = Math.min(100, Math.max(0, g.assessedProgressPct));
    const earnedMarks = (g.maxMarks * pct) / 100;
    return {
      goalId: g.goalId,
      title: g.title,
      earnedMarks,
      maxMarks: g.maxMarks,
      percentScore: pct,
    };
  });

  const goalsEarnedMarks = goalResults.reduce((s, g) => s + g.earnedMarks, 0);
  const goalsMaxMarks = goals.reduce((s, g) => s + g.maxMarks, 0);

  return { goalResults, goalsEarnedMarks, goalsMaxMarks };
}

export function updateGoalAssessedProgress(
  goals: SnapshotGoal[],
  goalId: string,
  assessedProgressPct: number
): SnapshotGoal[] {
  return goals.map((g) =>
    g.goalId === goalId
      ? { ...g, assessedProgressPct: Math.min(100, Math.max(0, assessedProgressPct)) }
      : g
  );
}
