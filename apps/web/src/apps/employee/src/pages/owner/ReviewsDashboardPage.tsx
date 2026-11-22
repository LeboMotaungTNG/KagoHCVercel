import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCheck, Clock, FileCheck, LayoutDashboard, RotateCcw, Users, X } from 'lucide-react';
import {
  assignReviewsToManagers,
  queryEvaluations,
  rejectEvaluation,
  requestChangesEvaluation,
  signOffEvaluation,
  type AssignReviewsResult,
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
import type { Evaluation, EvaluationStatus } from '../../types/evaluation';

type DecisionAction = 'reject' | 'request_changes';

function empName(e: Evaluation) {
  return typeof e.employeeId === 'string'
    ? e.employeeId
    : `${e.employeeId.firstName} ${e.employeeId.lastName}`;
}

const STATUS_LABEL: Partial<Record<EvaluationStatus, string>> = {
  pending_owner: 'Waiting for you',
  signed_off: 'Accepted (final)',
  rejected: 'Rejected',
  changes_requested: 'Sent back for changes',
};
const ACTION_LABEL: Record<string, string> = {
  assigned: 'Assigned to the manager',
  submitted: 'Self-review submitted',
  moderation_started: 'Sent to the manager for moderation',
  submitted_to_owner: 'Manager submitted it to the owner',
  accepted: 'Accepted',
  rejected: 'Rejected',
  changes_requested: 'Sent back for changes',
};

/** Owner/HR: assign a period's reviews to each employee's manager. */
function AssignReviewsModal({ onClose }: { onClose: () => void }) {
  const now = new Date();
  const [period, setPeriod] = useState(`${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`);
  const [department, setDepartment] = useState('');
  const [purpose, setPurpose] = useState<'quarterly' | 'annual' | 'probation' | 'ad_hoc'>('quarterly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(AssignReviewsResult & { message?: string }) | null>(null);

  const submit = async () => {
    if (!period.trim()) { setError('Enter the review period, e.g. 2026-Q4.'); return; }
    setBusy(true); setError(null);
    try {
      setResult(await assignReviewsToManagers({ period: period.trim(), department: department.trim() || undefined, purpose }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reviews could not be assigned.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(ev) => ev.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', background: C.surface, borderRadius: R.xl, border: `1px solid ${C.line}`, padding: 22 }}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>Assign reviews to managers</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              Creates a review for each employee, assigned to their manager. Managers complete it and submit it to you for approval.
            </div>
          </div>
          <button type="button" onClick={onClose} style={perfBtnGhost} aria-label="Close"><X size={16} /></button>
        </div>
        {!result ? (
          <>
            <label className="form-label small fw-semibold mt-2">Review period</label>
            <input className="form-control form-control-sm" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. 2026-Q4" />
            <label className="form-label small fw-semibold mt-3">Department (optional)</label>
            <input className="form-control form-control-sm" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Leave blank for every department" />
            <label className="form-label small fw-semibold mt-3">Purpose</label>
            <select className="form-select form-select-sm" value={purpose} onChange={(e) => setPurpose(e.target.value as typeof purpose)}>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="probation">Probation</option>
              <option value="ad_hoc">Ad hoc</option>
            </select>
            {error && <div className="mt-3"><AlertBanner tone="danger">{error}</AlertBanner></div>}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" onClick={onClose} style={perfBtnSecondary}>Cancel</button>
              <button type="button" onClick={() => void submit()} disabled={busy} style={perfBtnPrimary}>{busy ? 'Assigning…' : 'Assign reviews'}</button>
            </div>
          </>
        ) : (
          <>
            <AlertBanner tone={result.assigned.length ? 'ok' : 'warn'}>
              {result.message || `${result.assigned.length} assigned, ${result.skipped.length} skipped.`}
            </AlertBanner>
            {result.assigned.length > 0 && (
              <>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 10 }}>Assigned</div>
                <ul style={{ fontSize: 13, paddingLeft: 18, margin: '4px 0' }}>{result.assigned.map((a) => <li key={a.evaluationId}>{a.name}</li>)}</ul>
              </>
            )}
            {result.skipped.length > 0 && (
              <>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 10 }}>Skipped</div>
                <ul style={{ fontSize: 13, paddingLeft: 18, margin: '4px 0' }}>
                  {result.skipped.map((sk) => <li key={sk.employeeId}><strong>{sk.name}</strong> — {sk.reason}</li>)}
                </ul>
              </>
            )}
            <div className="d-flex justify-content-end mt-3"><button type="button" onClick={onClose} style={perfBtnPrimary}>Done</button></div>
          </>
        )}
      </div>
    </div>
  );
}

/** Read-only view of one review: scores, comments, decision and audit trail. */
function ReviewDetailModal({ evaluation, onClose }: { evaluation: Evaluation; onClose: () => void }) {
  const cats = evaluation.frameworkSnapshot?.categories || [];
  const itemFor = (criterionId: string) => evaluation.items.find((i) => i.criterionId === criterionId);
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto', background: C.surface, borderRadius: R.xl, border: `1px solid ${C.line}`, padding: 22 }}
      >
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{empName(evaluation)} · {evaluation.period}</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {STATUS_LABEL[evaluation.status] || evaluation.status.replace(/_/g, ' ')} · {evaluation.percentScore.toFixed(0)}%
              {evaluation.status === 'signed_off' ? ' · locked' : ''}
            </div>
          </div>
          <button type="button" onClick={onClose} style={perfBtnGhost} aria-label="Close"><X size={16} /></button>
        </div>

        {cats.map((cat: any) => (
          <div key={cat._id || cat.name} style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{cat.name}</div>
            {(cat.criteria || []).map((crit: any) => {
              const item = itemFor(String(crit._id));
              return (
                <div key={crit._id || crit.name} className="d-flex justify-content-between" style={{ fontSize: 13, padding: '4px 0', borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ color: C.text }}>{crit.name}{item?.comment ? <span style={{ color: C.muted }}> — {item.comment}</span> : null}</span>
                  <span style={{ fontWeight: 600 }}>{item?.score ?? '—'}</span>
                </div>
              );
            })}
          </div>
        ))}

        {evaluation.managerComment && (
          <div style={{ marginTop: 14, fontSize: 13 }}><strong>Manager's comment:</strong> {evaluation.managerComment}</div>
        )}
        {evaluation.ownerDecisionComment && (
          <div style={{ marginTop: 6, fontSize: 13 }}><strong>Owner's comment:</strong> {evaluation.ownerDecisionComment}</div>
        )}

        <div style={{ marginTop: 16, fontWeight: 700, fontSize: 13, color: C.text }}>Audit trail</div>
        {(evaluation.history || []).length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.muted }}>No recorded steps for this review (it was created before the audit trail existed).</div>
        ) : (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, color: C.text }}>
            {(evaluation.history || []).map((h, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <strong>{ACTION_LABEL[h.action] || h.action}</strong>
                {' — '}{h.byName || 'Unknown'}{h.role ? ` (${h.role.replace(/_/g, ' ')})` : ''}
                {', '}{new Date(h.at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                {h.comment ? <div style={{ color: C.muted }}>“{h.comment}”</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ReviewsDashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<{
    evaluation: Evaluation;
    action: DecisionAction;
  } | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Evaluation | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const refresh = () => queryEvaluations({}).then(setEvaluations);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  // The owner's list: final reviews only — manager reviews that reached the owner
  // (waiting for a decision, accepted, rejected or sent back). Self-reviews and
  // reviews still being moderated or drafted aren't shown here.
  const FINAL_STAGE: EvaluationStatus[] = ['pending_owner', 'signed_off', 'rejected', 'changes_requested'];
  const filtered = evaluations.filter((e) => {
    if (e.type !== 'manager_review' || !FINAL_STAGE.includes(e.status)) return false;
    if (statusFilter && e.status !== statusFilter) return false;
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

      <div className="d-flex justify-content-end mb-3">
        <button type="button" onClick={() => setAssignOpen(true)} style={{ ...perfBtnPrimary, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Users size={15} /> Assign reviews to managers
        </button>
      </div>
      {assignOpen && <AssignReviewsModal onClose={() => setAssignOpen(false)} />}

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

      <SectionCard icon={<LayoutDashboard size={16} />} title="Final reviews">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <select
            className="form-select form-select-sm w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EvaluationStatus | '')}
          >
            <option value="">All statuses</option>
            <option value="pending_owner">Waiting for you</option>
            <option value="signed_off">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Sent back for changes</option>
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
                <th>Status</th>
                <th>Score</th>
                <th>Owner note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ color: C.muted, fontSize: 13, padding: 16 }}>
                  No final reviews yet. They appear here once a manager submits a moderated review to you.
                </td></tr>
              )}
              {filtered.map((e) => (
                <tr
                  key={e._id}
                  onClick={() => setViewing(e)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter') setViewing(e); }}
                  tabIndex={0}
                  title="Open this review"
                  style={{ cursor: 'pointer' }}
                >
                  <td>{empName(e)}</td>
                  <td>{e.period}</td>
                  <td>{STATUS_LABEL[e.status] || e.status.replace(/_/g, ' ')}</td>
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

      {viewing && <ReviewDetailModal evaluation={viewing} onClose={() => setViewing(null)} />}

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
