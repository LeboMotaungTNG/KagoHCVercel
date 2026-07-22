import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCheck, Clock, FileCheck, LayoutDashboard, RotateCcw, Users, X } from 'lucide-react';
import {
  queryEvaluations,
  rejectEvaluation,
  requestChangesEvaluation,
  signOffEvaluation,
} from '../../api/evaluations.api';
import {
  AlertBanner,
  EmptyState,
  MeterRow,
  PageHero,
  PerformancePage,
  SectionCard,
  StatTile,
  perfBtnGhost,
  perfBtnPrimary,
  perfBtnSecondary,
} from '../../components/PerformanceUI';
import { C, R } from '../../../../../shared/utils/employee';
import type { Evaluation, EvaluationStatus, EvaluationType } from '../../types/evaluation';

type DecisionAction = 'reject' | 'request_changes';

function empName(e: Evaluation) {
  return typeof e.employeeId === 'string'
    ? e.employeeId
    : `${e.employeeId.firstName} ${e.employeeId.lastName}`;
}

export default function ReviewsDashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<EvaluationType | ''>('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<{
    evaluation: Evaluation;
    action: DecisionAction;
  } | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const refresh = () => queryEvaluations({}).then(setEvaluations);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const filtered = evaluations.filter((e) => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (typeFilter && e.type !== typeFilter) return false;
    if (periodFilter && e.period !== periodFilter) return false;
    return true;
  });

  const pendingOwner = evaluations.filter((e) => e.status === 'pending_owner' && e.type === 'manager_review');

  const stats = useMemo(() => {
    const total = evaluations.length;
    const avgByDept = evaluations.reduce<Record<string, { sum: number; count: number }>>((acc, e) => {
      const dept = typeof e.employeeId === 'string' ? 'Unknown' : e.employeeId.department;
      acc[dept] = acc[dept] ?? { sum: 0, count: 0 };
      if (e.percentScore > 0) {
        acc[dept].sum += e.percentScore;
        acc[dept].count += 1;
      }
      return acc;
    }, {});
    const awaitingModeration = evaluations.filter(
      (e) =>
        e.type === 'manager_review' &&
        (e.status === 'manager_in_progress' || e.status === 'draft' || e.status === 'changes_requested') &&
        e.linkedEvaluationId
    ).length;
    return { total, avgByDept, awaitingModeration, pendingOwner: pendingOwner.length };
  }, [evaluations, pendingOwner.length]);

  const gapPanel = useMemo(() => {
    const byEmployeePeriod: Record<string, { manager?: Evaluation; self?: Evaluation }> = {};
    evaluations.forEach((e) => {
      const empId = typeof e.employeeId === 'string' ? e.employeeId : e.employeeId._id;
      const key = `${empId}::${e.period}`;
      byEmployeePeriod[key] = byEmployeePeriod[key] ?? {};
      if (e.type === 'manager_review') byEmployeePeriod[key].manager = e;
      if (e.type === 'self_review') byEmployeePeriod[key].self = e;
    });
    return Object.values(byEmployeePeriod)
      .filter((pair) => pair.manager && pair.self)
      .map((pair) => ({
        period: pair.manager!.period,
        employee: empName(pair.manager!),
        gap: Math.abs(pair.manager!.percentScore - pair.self!.percentScore),
      }))
      .filter((row) => row.gap > 10);
  }, [evaluations]);

  const closeDecisionModal = () => {
    setDecisionTarget(null);
    setDecisionComment('');
    setDecisionError(null);
  };

  const handleAccept = async (id: string) => {
    setBusyId(id);
    setDecisionError(null);
    try {
      await signOffEvaluation(id);
      await refresh();
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : 'Failed to accept review');
    } finally {
      setBusyId(null);
    }
  };

  const openDecision = (evaluation: Evaluation, action: DecisionAction) => {
    setDecisionTarget({ evaluation, action });
    setDecisionComment('');
    setDecisionError(null);
  };

  const submitDecision = async () => {
    if (!decisionTarget) return;
    const comment = decisionComment.trim();
    if (!comment) {
      setDecisionError(
        decisionTarget.action === 'reject'
          ? 'A rejection comment is required.'
          : 'Please explain what changes are needed.'
      );
      return;
    }

    setBusyId(decisionTarget.evaluation._id);
    setDecisionError(null);
    try {
      if (decisionTarget.action === 'reject') {
        await rejectEvaluation(decisionTarget.evaluation._id, comment);
      } else {
        await requestChangesEvaluation(decisionTarget.evaluation._id, comment);
      }
      closeDecisionModal();
      await refresh();
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading dashboard…</div>;

  return (
    <PerformancePage>
      <PageHero
        icon={<LayoutDashboard size={24} color="#fff" />}
        title="Reviews Dashboard"
        subtitle="Accept, reject, or request changes on final manager reviews."
        badge={{ value: stats.pendingOwner, label: 'PENDING' }}
      />

      {decisionError && !decisionTarget && (
        <AlertBanner tone="danger">{decisionError}</AlertBanner>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatTile
            label="Total evaluations"
            value={String(stats.total)}
            icon={<ClipboardCheck size={18} />}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatTile
            label="Pending your approval"
            value={String(stats.pendingOwner)}
            icon={<FileCheck size={18} />}
            color={stats.pendingOwner > 0 ? C.warn : C.primary}
            bg={stats.pendingOwner > 0 ? C.warnBg : C.primaryBg}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatTile
            label="With managers"
            value={String(stats.awaitingModeration)}
            icon={<Clock size={18} />}
            color={C.blue}
            bg={C.blueBg}
          />
        </div>
      </div>

      <SectionCard icon={<FileCheck size={16} />} title="Final reviews awaiting approval">
        {pendingOwner.length === 0 && (
          <EmptyState
            icon={<FileCheck size={28} />}
            message="No final reviews waiting. Managers submit them after moderating self-reviews."
          />
        )}
        {pendingOwner.map((e) => (
          <div
            key={e._id}
            className="d-flex flex-wrap justify-content-between align-items-start gap-3 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: C.ink }}>{empName(e)}</div>
              <div className="small" style={{ color: C.muted }}>
                {e.period} · Final score {e.overallScore.toFixed(1)}/{e.maxScore}
                {e.ratingBand ? ` · ${e.ratingBand}` : ''}
              </div>
              {e.managerComment && (
                <div className="small mt-1" style={{ color: C.text, fontStyle: 'italic' }}>
                  &ldquo;{e.managerComment}&rdquo;
                </div>
              )}
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === e._id}
                onClick={() => handleAccept(e._id)}
                style={{ ...perfBtnPrimary, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} />
                {busyId === e._id ? 'Accepting…' : 'Accept'}
              </button>
              <button
                type="button"
                disabled={busyId === e._id}
                onClick={() => openDecision(e, 'request_changes')}
                style={{ ...perfBtnSecondary, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCcw size={14} />
                Request changes
              </button>
              <button
                type="button"
                disabled={busyId === e._id}
                onClick={() => openDecision(e, 'reject')}
                style={{
                  ...perfBtnGhost,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: C.bad,
                  borderColor: C.bad,
                }}
              >
                <X size={14} />
                Reject
              </button>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard icon={<Users size={16} />} title="Average score by department">
        {Object.entries(stats.avgByDept).map(([dept, { sum, count }]) => {
          const avg = count > 0 ? sum / count : 0;
          return <MeterRow key={dept} label={dept} meta={`${avg.toFixed(0)}%`} pct={avg} />;
        })}
        {Object.keys(stats.avgByDept).length === 0 && (
          <div style={{ color: C.muted, fontSize: 13 }}>No scored evaluations yet.</div>
        )}
      </SectionCard>

      {gapPanel.length > 0 && (
        <SectionCard icon={<ClipboardCheck size={16} />} title="Manager vs self-assessment gaps">
          {gapPanel.map((row) => (
            <div
              className="d-flex justify-content-between small py-2"
              style={{ borderBottom: `1px solid ${C.line}`, color: C.text }}
              key={`${row.employee}-${row.period}`}
            >
              <span>
                {row.employee} · {row.period}
              </span>
              <span style={{ color: C.warn, fontWeight: 600 }}>{row.gap.toFixed(0)} pt gap</span>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard icon={<LayoutDashboard size={16} />} title="All evaluations">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <select
            className="form-select form-select-sm w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EvaluationStatus | '')}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="manager_in_progress">Manager in progress</option>
            <option value="pending_owner">Pending owner</option>
            <option value="changes_requested">Changes requested</option>
            <option value="rejected">Rejected</option>
            <option value="reviewed">Reviewed</option>
            <option value="signed_off">Signed off / accepted</option>
          </select>
          <select
            className="form-select form-select-sm w-auto"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EvaluationType | '')}
          >
            <option value="">All types</option>
            <option value="manager_review">Manager review</option>
            <option value="self_review">Self-review</option>
          </select>
          <input
            className="form-control form-control-sm w-auto"
            placeholder="Period, e.g. Q2 2026"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Type</th>
                <th>Status</th>
                <th>Score</th>
                <th>Owner note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e._id}>
                  <td>{empName(e)}</td>
                  <td>{e.period}</td>
                  <td>{e.type === 'manager_review' ? 'Manager review' : 'Self-review'}</td>
                  <td>{e.status.replace(/_/g, ' ')}</td>
                  <td>{e.percentScore.toFixed(0)}%</td>
                  <td style={{ maxWidth: 220, fontSize: 12, color: C.muted }}>
                    {e.ownerDecisionComment || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {decisionTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={closeDecisionModal}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: C.surface,
              borderRadius: R.xl,
              border: `1px solid ${C.line}`,
              padding: 22,
              boxShadow: '0 20px 50px rgba(15,23,42,0.2)',
            }}
          >
            <h2 className="h5 mb-1" style={{ color: C.ink, fontWeight: 700 }}>
              {decisionTarget.action === 'reject' ? 'Reject review' : 'Request changes'}
            </h2>
            <p className="mb-3" style={{ color: C.muted, fontSize: 14 }}>
              {empName(decisionTarget.evaluation)} · {decisionTarget.evaluation.period}. A comment is required
              {decisionTarget.action === 'reject' ? ' for rejection.' : ' so the manager knows what to revise.'}
            </p>
            <label className="form-label small" style={{ color: C.muted, fontWeight: 600 }}>
              Comment <span style={{ color: C.bad }}>*</span>
            </label>
            <textarea
              className="form-control"
              rows={4}
              autoFocus
              value={decisionComment}
              onChange={(e) => {
                setDecisionComment(e.target.value);
                if (decisionError) setDecisionError(null);
              }}
              placeholder={
                decisionTarget.action === 'reject'
                  ? 'Explain why this review is rejected…'
                  : 'Describe the changes the manager must make…'
              }
              style={{ borderRadius: R.md, borderColor: decisionError ? C.bad : C.line }}
            />
            {decisionError && (
              <div className="mt-2" style={{ color: C.bad, fontSize: 13, fontWeight: 600 }}>
                {decisionError}
              </div>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" onClick={closeDecisionModal} style={perfBtnGhost}>
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === decisionTarget.evaluation._id}
                onClick={submitDecision}
                style={
                  decisionTarget.action === 'reject'
                    ? {
                        ...perfBtnPrimary,
                        background: C.bad,
                      }
                    : perfBtnPrimary
                }
              >
                {busyId === decisionTarget.evaluation._id
                  ? 'Submitting…'
                  : decisionTarget.action === 'reject'
                    ? 'Confirm reject'
                    : 'Send back to manager'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PerformancePage>
  );
}
