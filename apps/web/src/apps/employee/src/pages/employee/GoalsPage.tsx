import { useEffect, useMemo, useState } from 'react';
import { Link2, Target, TrendingUp, Network } from 'lucide-react';
import { listGoals, listObjectives, updateGoal } from '../../api/goals.api';
import {
  EmptyState,
  PageHero,
  PerformancePage,
  SectionCard,
  StatTile,
} from '../../components/PerformanceUI';
import { getCurrentUserId } from '../../utils/session';
import { C, FONT_NUM, R } from '../../../../../shared/utils/employee';
import type { EmployeeGoal, GoalStatus, OrganizationalObjective } from '../../types/goals';

const STATUS_STYLE: Record<GoalStatus, { bg: string; color: string; label: string }> = {
  draft: { bg: C.surfaceAlt, color: C.muted, label: 'Draft' },
  in_progress: { bg: C.primaryBg, color: C.primaryDark, label: 'In progress' },
  on_track: { bg: C.okBg, color: C.ok, label: 'On track' },
  at_risk: { bg: C.warnBg, color: C.warn, label: 'At risk' },
  completed: { bg: C.greenBg, color: C.green, label: 'Completed' },
  cancelled: { bg: C.badBg, color: C.bad, label: 'Cancelled' },
};

export default function GoalsPage() {
  const employeeId = getCurrentUserId();
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [objectives, setObjectives] = useState<OrganizationalObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [g, o] = await Promise.all([
      listGoals({ employeeId }),
      listObjectives({ status: 'active' }),
    ]);
    setGoals(g);
    setObjectives(o);
  };

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load goals'))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const objectiveMap = useMemo(() => {
    const map = new Map<string, OrganizationalObjective>();
    objectives.forEach((o) => map.set(o._id, o));
    return map;
  }, [objectives]);

  const avgProgress =
    goals.length > 0 ? goals.reduce((s, g) => s + g.progressPct, 0) / goals.length : 0;

  const bumpProgress = async (goal: EmployeeGoal, next: number) => {
    const status: GoalStatus =
      next >= 100 ? 'completed' : next < 40 ? 'at_risk' : next >= 60 ? 'on_track' : 'in_progress';
    const updated = await updateGoal(goal._id, { progressPct: next, status });
    setGoals((prev) => prev.map((g) => (g._id === goal._id ? updated : g)));
  };

  if (loading) return <div style={{ color: C.muted, padding: 24 }}>Loading goals…</div>;

  return (
    <PerformancePage>
      <PageHero
        icon={<Target size={24} color="#fff" />}
        title="My goals"
        subtitle="Goals assigned by your manager, linked to organisational objectives. Update your progress here."
      />

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-4">
          <StatTile
            label="Active goals"
            value={String(goals.filter((g) => g.status !== 'cancelled').length)}
            icon={<Target size={18} />}
          />
        </div>
        <div className="col-6 col-lg-4">
          <StatTile
            label="Avg progress"
            value={`${avgProgress.toFixed(0)}%`}
            icon={<TrendingUp size={18} />}
            color={C.green}
            bg={C.greenBg}
          />
        </div>
        <div className="col-12 col-lg-4">
          <StatTile
            label="Linked objectives"
            value={String(new Set(goals.map((g) => g.objectiveId)).size)}
            icon={<Network size={18} />}
            color={C.blue}
            bg={C.blueBg}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: C.badBg, color: C.bad, padding: '10px 14px', borderRadius: R.md, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {goals.length === 0 && (
        <EmptyState
          icon={<Target size={28} />}
          message="No goals assigned yet. Your manager will set goals under organisational objectives."
        />
      )}

      {goals.map((goal) => {
        const obj = objectiveMap.get(goal.objectiveId);
        const st = STATUS_STYLE[goal.status];
        return (
          <SectionCard key={goal._id}>
            <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
              <div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 16 }}>{goal.title}</div>
                  {goal.createdByRole === 'manager' && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 20,
                        background: C.primaryBg,
                        color: C.primaryDark,
                      }}
                    >
                      Assigned by manager
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{goal.description}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: st.bg,
                  color: st.color,
                  whiteSpace: 'nowrap',
                }}
              >
                {st.label}
              </span>
            </div>

            <div
              className="d-flex align-items-start gap-2 mb-3"
              style={{
                background: C.primaryTint,
                borderRadius: R.md,
                padding: '10px 12px',
                fontSize: 13,
              }}
            >
              <Link2 size={16} color={C.primaryDark} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: C.primaryDark }}>Linked objective</div>
                <div style={{ color: C.text }}>
                  {obj?.title ?? 'Unknown objective'}
                  {obj?.department ? ` · ${obj.department}` : ' · Company-wide'}
                  {obj?.targetMetric ? ` · ${obj.targetMetric}` : ''}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between small mb-1" style={{ color: C.muted }}>
              <span>
                {goal.period}
                {goal.evaluationPeriod ? ` · Eval ${goal.evaluationPeriod}` : ''}
                {` · ${goal.priority} priority`}
              </span>
              <span style={{ ...FONT_NUM, fontWeight: 700, color: C.ink }}>{goal.progressPct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: C.line, overflow: 'hidden', marginBottom: 12 }}>
              <div
                style={{
                  width: `${goal.progressPct}%`,
                  height: '100%',
                  background: goal.status === 'at_risk' ? C.warn : C.primary,
                }}
              />
            </div>

            <div className="d-flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => bumpProgress(goal, pct)}
                  style={{
                    border: `1px solid ${C.line}`,
                    background: goal.progressPct === pct ? C.primaryBg : C.surface,
                    color: C.text,
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </SectionCard>
        );
      })}
    </PerformancePage>
  );
}
