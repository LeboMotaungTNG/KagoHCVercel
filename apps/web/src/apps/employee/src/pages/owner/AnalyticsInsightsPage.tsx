import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Layers,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getPerformanceAnalytics, updateRecommendation } from '../../api/analytics.api';
import {
  EmptyState,
  FilterTabs,
  MeterRow,
  PageHero,
  PerformancePage,
  SectionCard,
  SectionHeading,
  StatTile,
  perfBtnGhost,
  perfBtnPrimary,
  perfBtnSecondary,
} from '../../components/PerformanceUI';
import { C, R, SHADOW } from '../../../../../shared/utils/employee';
import type {
  PerformanceAnalytics,
  RecommendationSeverity,
  RecommendationStatus,
  TrainingRecommendation,
} from '../../types/analytics';

const SEVERITY: Record<RecommendationSeverity, { bg: string; color: string; label: string }> = {
  urgent: { bg: C.badBg, color: C.bad, label: 'Urgent' },
  watch: { bg: C.warnBg, color: C.warn, label: 'Watch' },
  info: { bg: C.primaryBg, color: C.primaryDark, label: 'Info' },
};

const STATUS_STYLE: Record<RecommendationStatus, { bg: string; color: string; label: string }> = {
  suggested: { bg: C.surfaceAlt, color: C.muted, label: 'Suggested' },
  accepted: { bg: C.primaryBg, color: C.primaryDark, label: 'Accepted' },
  in_progress: { bg: C.okBg, color: C.ok, label: 'In progress' },
  completed: { bg: C.greenBg, color: C.green, label: 'Completed' },
  dismissed: { bg: C.badBg, color: C.bad, label: 'Dismissed' },
};

type ViewMode = 'manager' | 'owner' | 'employee';
type FilterTab = 'suggested' | 'active' | 'dismissed' | 'all';

interface Props {
  employeeId?: string;
  /** Who is viewing — controls actions and which items show. */
  mode?: ViewMode;
}

export default function AnalyticsInsightsPage({ employeeId, mode = 'owner' }: Props) {
  const [data, setData] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>(mode === 'employee' ? 'active' : 'suggested');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActions, setEditActions] = useState('');
  const [editDue, setEditDue] = useState('');
  const [dismissId, setDismissId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState('');

  const canCurate = mode === 'manager';

  const refresh = async () => {
    const next = await getPerformanceAnalytics({ employeeId });
    setData(next);
  };

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const recommendations = useMemo(() => {
    if (!data) return [];
    let list = data.recommendations;
    if (mode === 'employee') {
      list = list.filter((r) =>
        ['accepted', 'in_progress', 'completed'].includes(r.status)
      );
    }
    if (filter === 'suggested') list = list.filter((r) => r.status === 'suggested');
    if (filter === 'active') {
      list = list.filter((r) => ['accepted', 'in_progress', 'completed'].includes(r.status));
    }
    if (filter === 'dismissed') list = list.filter((r) => r.status === 'dismissed');
    return list;
  }, [data, filter, mode]);

  const applyDecision = async (
    rec: TrainingRecommendation,
    payload: Parameters<typeof updateRecommendation>[1]
  ) => {
    setBusyId(rec.fingerprint);
    setError(null);
    try {
      await updateRecommendation(rec.fingerprint, payload, {
        employeeId: rec.employeeId,
        employeeName: rec.employeeName,
        title: rec.title,
      });
      setEditingId(null);
      setDismissId(null);
      setDismissReason('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update intervention');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Generating insights…</div>;
  if (error && !data) return <div className="p-4 text-danger">{error}</div>;
  if (!data) return null;

  const title =
    mode === 'employee'
      ? 'My development plan'
      : 'Performance analytics & interventions';
  const subtitle =
    mode === 'employee'
      ? 'Interventions your manager accepted for you — track progress and suggested actions.'
      : mode === 'manager'
        ? 'System proposes interventions from scores and goals. Accept, modify, or dismiss — accepted items become the employee development plan.'
        : 'Organisation-wide scores, goal health, and intervention pipeline.';

  const tabs: { key: FilterTab; label: string }[] =
    mode === 'employee'
      ? [{ key: 'active', label: 'My plan' }]
      : [
          { key: 'suggested', label: 'Suggested' },
          { key: 'active', label: 'Active plan' },
          { key: 'dismissed', label: 'Dismissed' },
          { key: 'all', label: 'All' },
        ];

  const activeCount = data.recommendations.filter((r) =>
    ['accepted', 'in_progress'].includes(r.status)
  ).length;

  return (
    <PerformancePage>
      <PageHero
        icon={<BarChart3 size={24} color="#fff" />}
        title={title}
        subtitle={subtitle}
        badge={mode !== 'employee' ? { value: activeCount, label: 'ACTIVE PLANS' } : undefined}
      />

      {mode !== 'employee' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatTile
                label="Avg score"
                value={`${data.avgOverallPercent.toFixed(0)}%`}
                icon={<TrendingUp size={18} />}
                color={C.primary}
                bg={C.primaryBg}
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatTile
                label="Evaluations"
                value={String(data.totalEvaluations)}
                icon={<Sparkles size={18} />}
                color={C.blue}
                bg={C.blueBg}
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatTile
                label="Goals on track"
                value={`${data.goalsOnTrack}/${data.goalsTotal}`}
                icon={<Target size={18} />}
                color={C.green}
                bg={C.greenBg}
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatTile
                label="At-risk goals"
                value={String(data.goalsAtRisk)}
                icon={<AlertTriangle size={18} />}
                color={data.goalsAtRisk > 0 ? C.bad : C.muted}
                bg={data.goalsAtRisk > 0 ? C.badBg : C.surfaceAlt}
              />
            </div>
          </div>

          <SectionCard icon={<Lightbulb size={16} />} title="Coaching insights">
            <ul className="mb-0" style={{ listStyle: 'none', padding: 0 }}>
              {data.coachingInsights.map((line) => (
                <li key={line} className="d-flex align-items-start gap-2 mb-2" style={{ color: C.text, fontSize: 14 }}>
                  <CheckCircle2 size={16} color={C.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <SectionCard icon={<Building2 size={16} />} title="By department" fill>
                {data.byDepartment.length === 0 && (
                  <div style={{ color: C.muted, fontSize: 13 }}>No department scores yet.</div>
                )}
                {data.byDepartment.map((row) => (
                  <MeterRow
                    key={row.department}
                    label={row.department}
                    meta={`${row.avgPercent.toFixed(0)}% · ${row.evaluationCount} reviews${
                      row.atRiskCount > 0 ? ` · ${row.atRiskCount} at risk` : ''
                    }`}
                    pct={row.avgPercent}
                    danger={row.avgPercent < 50}
                  />
                ))}
              </SectionCard>
            </div>
            <div className="col-md-6">
              <SectionCard icon={<Layers size={16} />} title="By pillar" fill>
                {data.byPillar.length === 0 && (
                  <div style={{ color: C.muted, fontSize: 13 }}>Pillar trends appear after manager reviews.</div>
                )}
                {data.byPillar.map((row) => (
                  <MeterRow
                    key={row.pillar}
                    label={row.pillar}
                    meta={`${row.avgPercent.toFixed(0)}% · ${row.lowScoreCount} low`}
                    pct={row.avgPercent}
                  />
                ))}
              </SectionCard>
            </div>
          </div>
        </>
      )}

      {error && (
        <div
          className="mb-3"
          style={{ background: C.badBg, color: C.bad, padding: '10px 14px', borderRadius: R.md, fontSize: 14 }}
        >
          {error}
        </div>
      )}

      <SectionHeading
        icon={<Target size={16} />}
        title={mode === 'employee' ? 'Plan items' : 'Interventions'}
        count={recommendations.length}
        actions={<FilterTabs tabs={tabs} value={filter} onChange={setFilter} />}
      />

      {recommendations.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 size={28} />}
          message={
            mode === 'employee'
              ? 'No development-plan items yet. Your manager will accept interventions from team insights.'
              : filter === 'suggested'
                ? 'No new suggestions — scores and goals look healthy, or items were already triage’d.'
                : 'Nothing in this view yet.'
          }
        />
      )}

      {recommendations.map((rec) => {
        const sev = SEVERITY[rec.severity];
        const st = STATUS_STYLE[rec.status];
        const busy = busyId === rec.fingerprint;
        return (
          <div
            key={rec._id}
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderLeft: `4px solid ${sev.color}`,
              borderRadius: R.xl,
              boxShadow: SHADOW,
              padding: 18,
              marginBottom: 12,
            }}
          >
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <div>
                <div style={{ fontWeight: 700, color: C.ink }}>{rec.title}</div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  {mode !== 'employee' && (
                    <>
                      {rec.employeeName} · {rec.department} ·{' '}
                    </>
                  )}
                  {rec.category.replace('_', ' ')}
                  {rec.dueDate ? ` · Due ${rec.dueDate}` : ''}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: st.bg,
                    color: st.color,
                    height: 'fit-content',
                  }}
                >
                  {st.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: sev.bg,
                    color: sev.color,
                    height: 'fit-content',
                  }}
                >
                  {sev.label}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: C.text, marginBottom: 10 }}>{rec.rationale}</p>
            {rec.notes && (
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
                <strong>Notes:</strong> {rec.notes}
              </p>
            )}
            {rec.dismissReason && (
              <p style={{ fontSize: 13, color: C.bad, marginBottom: 10 }}>
                <strong>Dismissed:</strong> {rec.dismissReason}
              </p>
            )}
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.muted,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Suggested actions
            </div>
            <ul className="mb-3 ps-3" style={{ fontSize: 13, color: C.text }}>
              {rec.suggestedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>

            {canCurate && rec.status === 'suggested' && (
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    applyDecision(rec, {
                      status: 'accepted',
                      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                    })
                  }
                  style={perfBtnPrimary}
                >
                  Accept to plan
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditingId(rec.fingerprint);
                    setEditActions(rec.suggestedActions.join('\n'));
                    setEditDue(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
                  }}
                  style={perfBtnSecondary}
                >
                  Modify & accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDismissId(rec.fingerprint);
                    setDismissReason('');
                  }}
                  style={perfBtnGhost}
                >
                  Dismiss
                </button>
              </div>
            )}

            {canCurate && (rec.status === 'accepted' || rec.status === 'in_progress') && (
              <div className="d-flex flex-wrap gap-2">
                {rec.status === 'accepted' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      applyDecision(rec, {
                        status: 'in_progress',
                        suggestedActions: rec.suggestedActions,
                        dueDate: rec.dueDate,
                        notes: rec.notes,
                      })
                    }
                    style={perfBtnSecondary}
                  >
                    Mark in progress
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    applyDecision(rec, {
                      status: 'completed',
                      suggestedActions: rec.suggestedActions,
                      dueDate: rec.dueDate,
                      notes: rec.notes,
                    })
                  }
                  style={perfBtnPrimary}
                >
                  Mark completed
                </button>
              </div>
            )}

            {editingId === rec.fingerprint && (
              <div
                className="mt-3"
                style={{
                  border: `1px solid ${C.line}`,
                  borderRadius: R.md,
                  padding: 14,
                  background: C.surfaceAlt,
                }}
              >
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Actions (one per line)
                </label>
                <textarea
                  className="form-control mb-2"
                  rows={4}
                  value={editActions}
                  onChange={(e) => setEditActions(e.target.value)}
                />
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Due date
                </label>
                <input
                  type="date"
                  className="form-control mb-3"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      applyDecision(rec, {
                        status: 'accepted',
                        suggestedActions: editActions
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                        dueDate: editDue || undefined,
                      })
                    }
                    style={perfBtnPrimary}
                  >
                    Save to development plan
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} style={perfBtnGhost}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {dismissId === rec.fingerprint && (
              <div
                className="mt-3"
                style={{
                  border: `1px solid ${C.line}`,
                  borderRadius: R.md,
                  padding: 14,
                  background: C.surfaceAlt,
                }}
              >
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Reason for dismiss (required)
                </label>
                <input
                  className="form-control mb-3"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="e.g. Already addressed in Q1 coaching"
                />
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !dismissReason.trim()}
                    onClick={() =>
                      applyDecision(rec, {
                        status: 'dismissed',
                        dismissReason: dismissReason.trim(),
                      })
                    }
                    style={{ ...perfBtnPrimary, background: C.bad, opacity: !dismissReason.trim() ? 0.6 : 1 }}
                  >
                    Confirm dismiss
                  </button>
                  <button type="button" onClick={() => setDismissId(null)} style={perfBtnGhost}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </PerformancePage>
  );
}
