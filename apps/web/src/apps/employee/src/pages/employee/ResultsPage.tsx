import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, ClipboardCheck, ClipboardList, TrendingUp } from 'lucide-react';
import { queryEvaluations } from '../../api/evaluations.api';
import RatingBadge from '../../components/RatingBadge';
import {
  EmptyState,
  FilterTabs,
  PageHero,
  PerformancePage,
  StatTile,
} from '../../components/PerformanceUI';
import { resolveCurrentEmployee } from '../../utils/resolveEmployee';
import { buildPillarSummaries } from '../../utils/scoring';
import { C, R, SHADOW, FONT_NUM } from '../../../../../shared/utils/employee';
import type { Evaluation, EvaluationStatus } from '../../types/evaluation';

const STATUS_STYLES: Record<EvaluationStatus, { bg: string; color: string; label: string }> = {
  draft: { bg: C.surfaceAlt, color: C.muted, label: 'Draft' },
  submitted: { bg: C.primaryBg, color: C.primaryDark, label: 'Awaiting manager' },
  manager_in_progress: { bg: C.warnBg, color: C.warn, label: 'Manager moderating' },
  pending_owner: { bg: C.blueBg, color: C.blue, label: 'Pending owner' },
  changes_requested: { bg: C.warnBg, color: C.warn, label: 'Changes requested' },
  rejected: { bg: C.badBg, color: C.bad, label: 'Rejected' },
  reviewed: { bg: C.okBg, color: C.ok, label: 'Acknowledged' },
  signed_off: { bg: C.greenBg, color: C.green, label: 'Accepted' },
};

function ScoreRing({ score, max = 100, size = 72 }: { score: number; max?: number; size?: number }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const pct = Math.min(100, (safeScore / safeMax) * 100);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${C.primary} ${pct}%, ${C.line} ${pct}% 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size - 14,
          height: size - 14,
          borderRadius: '50%',
          background: C.surface,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...FONT_NUM,
        }}
      >
        <span style={{ fontSize: size > 60 ? 18 : 15, fontWeight: 700, color: C.ink, lineHeight: 1 }}>
          {safeScore.toFixed(0)}
        </span>
        <span style={{ fontSize: 10, color: C.muted }}>/{safeMax}</span>
      </div>
    </div>
  );
}

type ViewMode = 'list' | 'compare';

export default function ResultsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const emp = await resolveCurrentEmployee();
        if (cancelled) return;
        if (!emp) {
          setEvaluations([]);
          return;
        }
        setEmployeeId(emp._id);
        try {
          const list = await queryEvaluations({ employeeId: emp._id });
          if (!cancelled) setEvaluations(Array.isArray(list) ? list : []);
        } catch {
          if (!cancelled) setEvaluations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const managerReviews = evaluations.filter((e) => e.type === 'manager_review');
    const latest = [...managerReviews].sort((a, b) => b.period.localeCompare(a.period))[0];
    const pendingAck = managerReviews.filter((e) => e.status === 'submitted').length;
    const score = latest?.overallScore;
    return {
      latestScore: typeof score === 'number' && Number.isFinite(score) ? score.toFixed(1) : '—',
      latestBand: latest?.ratingBand ?? '',
      total: evaluations.length,
      pendingAck,
    };
  }, [evaluations]);

  const acknowledge = (id: string) => {
    setEvaluations((prev) =>
      prev.map((e) => (e._id === id ? { ...e, status: 'reviewed' as EvaluationStatus } : e))
    );
  };

  const periodsWithBoth = evaluations.reduce<Record<string, Evaluation[]>>((acc, e) => {
    acc[e.period] = [...(acc[e.period] ?? []), e];
    return acc;
  }, {});

  const compareMode = viewMode === 'compare';

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5" style={{ color: C.muted }}>
        Loading your reviews…
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="p-4" style={{ color: C.bad }}>
        Could not find your employee record. Ask HR to link your login to an employee profile.
      </div>
    );
  }

  return (
    <PerformancePage>
      <PageHero
        icon={<ClipboardList size={24} color="#fff" />}
        title="My Reviews"
        subtitle="View your performance history, category breakdowns, and manager feedback."
      />

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatTile
            icon={<TrendingUp size={18} />}
            label="Latest score"
            value={stats.latestScore}
            sub={stats.latestBand || 'No manager review yet'}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatTile
            icon={<ClipboardCheck size={18} />}
            label="Total reviews"
            value={String(stats.total)}
            sub={`${stats.pendingAck} pending acknowledgement`}
            color={C.blue}
            bg={C.blueBg}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatTile
            icon={<BarChart3 size={18} />}
            label="Framework"
            value="100 pts"
            sub="Each criterion max 5 · Goals 20"
            color={C.green}
            bg={C.greenBg}
          />
        </div>
      </div>

      <div className="mb-4">
        <FilterTabs
          tabs={[
            { key: 'list', label: 'All reviews' },
            { key: 'compare', label: 'Compare self vs manager' },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {!compareMode && evaluations.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={28} />}
          message="No reviews yet. Complete a self-review or wait for your manager's evaluation to appear here."
        />
      )}

      {!compareMode &&
        evaluations.map((evaluation) => {
          const isExpanded = expandedId === evaluation._id;
          const statusStyle = STATUS_STYLES[evaluation.status] ?? STATUS_STYLES.draft;
          const isManager = evaluation.type === 'manager_review';
          const snapshot = evaluation.frameworkSnapshot;
          const categoryResults = evaluation.categoryResults ?? [];
          const pillars = buildPillarSummaries(snapshot, categoryResults, evaluation);
          const overallScore = Number(evaluation.overallScore) || 0;
          const maxScore = Number(evaluation.maxScore) || 100;
          const frameworkName = snapshot?.name || 'Performance framework';
          const purposeLabel = String(evaluation.purpose || 'review').replace(/_/g, ' ');

          return (
            <div
              key={evaluation._id}
              style={{
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderRadius: R.xl,
                boxShadow: SHADOW,
                marginBottom: 14,
                overflow: 'hidden',
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : evaluation._id)}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedId(isExpanded ? null : evaluation._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                  borderLeft: `4px solid ${isManager ? C.primary : C.green}`,
                  cursor: 'pointer',
                }}
              >
                <ScoreRing score={overallScore} max={maxScore} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                    <span style={{ fontWeight: 700, color: C.ink, fontSize: 16 }}>{evaluation.period}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: isManager ? C.primaryBg : C.greenBg,
                        color: isManager ? C.primaryDark : C.green,
                      }}
                    >
                      {isManager ? 'Manager review' : 'Self-review'}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>
                    {frameworkName} · {purposeLabel}
                  </div>
                  {evaluation.ratingBand && (
                    <div className="mt-2">
                      <RatingBadge label={evaluation.ratingBand} color={evaluation.ratingColor} />
                    </div>
                  )}
                </div>

                <div style={{ color: C.muted, flexShrink: 0 }}>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${C.line}` }}>
                  <div className="pt-3 mb-3">
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: C.muted,
                        marginBottom: 12,
                      }}
                    >
                      Pillar breakdown
                    </div>
                    {pillars.length === 0 && (
                      <div style={{ fontSize: 13, color: C.muted }}>
                        Detailed pillar breakdown isn’t available in the list view yet.
                      </div>
                    )}
                    {pillars.map((pillar) => {
                      const pct = pillar.maxMarks > 0 ? (pillar.earnedMarks / pillar.maxMarks) * 100 : 0;
                      return (
                        <div key={pillar.key} className="mb-3">
                          <div className="d-flex justify-content-between small mb-1">
                            <span style={{ fontWeight: 600, color: C.text }}>{pillar.label}</span>
                            <span style={{ color: C.muted, ...FONT_NUM }}>
                              {(pillar.earnedMarks ?? 0).toFixed(1)} / {pillar.maxMarks}
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                borderRadius: 3,
                                background: C.primary,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {categoryResults.length > 0 && (
                    <div className="mb-3">
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: C.muted,
                          marginBottom: 10,
                        }}
                      >
                        Category detail
                      </div>
                      <div
                        style={{
                          background: C.surfaceAlt,
                          borderRadius: R.md,
                          padding: '10px 14px',
                        }}
                      >
                        {categoryResults.map((cat) => (
                          <div
                            key={cat.categoryId}
                            className="d-flex justify-content-between py-1"
                            style={{ fontSize: 13, color: C.text }}
                          >
                            <span>{cat.name}</span>
                            <span style={{ ...FONT_NUM, color: C.muted }}>
                              {(cat.earnedMarks ?? 0).toFixed(1)} / {cat.maxMarks}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(evaluation.managerComment || evaluation.employeeComment) && (
                    <div
                      style={{
                        background: C.primaryTint,
                        borderLeft: `3px solid ${C.primary}`,
                        borderRadius: `0 ${R.md}px ${R.md}px 0`,
                        padding: '12px 16px',
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.primaryDark, marginBottom: 4 }}>
                        {isManager ? "Manager's comment" : 'Your comment'}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: C.text, fontStyle: 'italic' }}>
                        &ldquo;{evaluation.managerComment || evaluation.employeeComment}&rdquo;
                      </p>
                    </div>
                  )}

                  {isManager && evaluation.status === 'submitted' && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        acknowledge(evaluation._id);
                      }}
                      style={{
                        background: C.primary,
                        borderColor: C.primary,
                        color: '#fff',
                        fontWeight: 600,
                        borderRadius: 10,
                        padding: '8px 20px',
                      }}
                    >
                      Acknowledge review
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {compareMode && (
        <>
          {Object.entries(periodsWithBoth).filter(([, evals]) => {
            return evals.some((e) => e.type === 'manager_review') && evals.some((e) => e.type === 'self_review');
          }).length === 0 && (
            <EmptyState
              icon={<BarChart3 size={28} />}
              message="No periods with both self and manager reviews to compare yet."
            />
          )}

          {Object.entries(periodsWithBoth).map(([period, evals]) => {
            const manager = evals.find((e) => e.type === 'manager_review');
            const self = evals.find((e) => e.type === 'self_review');
            if (!manager || !self) return null;
            const managerPct = Number(manager.percentScore) || 0;
            const selfPct = Number(self.percentScore) || 0;
            const gap = Math.abs(managerPct - selfPct);

            return (
              <div
                key={period}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                  borderRadius: R.xl,
                  boxShadow: SHADOW,
                  padding: 22,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 16, marginBottom: 16 }}>{period}</div>
                <div className="row g-3 align-items-center">
                  <div className="col-5 text-center">
                    <ScoreRing score={Number(self.overallScore) || 0} max={Number(self.maxScore) || 100} size={80} />
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontWeight: 600 }}>Self-assessed</div>
                    <RatingBadge label={self.ratingBand} color={self.ratingColor} />
                  </div>
                  <div className="col-2 text-center" style={{ color: C.muted, fontSize: 13 }}>
                    vs
                  </div>
                  <div className="col-5 text-center">
                    <ScoreRing
                      score={Number(manager.overallScore) || 0}
                      max={Number(manager.maxScore) || 100}
                      size={80}
                    />
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontWeight: 600 }}>Manager-assessed</div>
                    <RatingBadge label={manager.ratingBand} color={manager.ratingColor} />
                  </div>
                </div>
                {gap > 10 && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '10px 14px',
                      borderRadius: R.md,
                      background: C.warnBg,
                      color: C.warn,
                      fontSize: 13,
                    }}
                  >
                    Noticeable gap of {gap.toFixed(0)} points — worth a conversation with your manager.
                  </div>
                )}
                {gap <= 10 && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '10px 14px',
                      borderRadius: R.md,
                      background: C.okBg,
                      color: C.ok,
                      fontSize: 13,
                    }}
                  >
                    Scores are closely aligned ({gap.toFixed(0)} pt difference).
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </PerformancePage>
  );
}
