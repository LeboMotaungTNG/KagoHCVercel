// Shared evaluation form — self-review (and legacy manager review).

import { useMemo } from 'react';
import { ClipboardPen, CheckCircle2 } from 'lucide-react';
import ScorePicker from './ScorePicker';
import EvaluationSummary from './EvaluationSummary';
import GoalsAttainmentPanel from './GoalsAttainmentPanel';
import {
  AlertBanner,
  PageHero,
  PerformancePage,
  PillarHeader,
  SectionCard,
  StatusBadge,
  perfBtnSecondary,
} from './PerformanceUI';
import { useEvaluation } from '../hooks/useEvaluation';
import { scoreEvaluation } from '../api/evaluations.api';
import { getSessionUser } from '../utils/session';
import { pillarForCategoryOrder } from '../utils/scoring';
import { C, R } from '../../../../shared/utils/employee';
import type { EvaluationPurpose, EvaluationType } from '../types/evaluation';

interface EvaluationFormProps {
  employeeId: string;
  employeeName?: string;
  managerName?: string;
  department?: string;
  designation?: string;
  period: string;
  purpose: EvaluationPurpose;
  type: EvaluationType;
}

const PILLAR_LABELS: Record<string, string> = {
  functional: 'FUNCTIONAL SKILLS',
  interpersonal: 'INTERPERSONAL SKILLS',
  leadership: 'LEADERSHIP SKILLS',
};

const PURPOSE_LABELS: Record<EvaluationPurpose, string> = {
  annual: 'Annual review',
  quarterly: 'Quarterly review',
  probation: 'Probation review',
  ad_hoc: 'Ad hoc review',
};

export default function EvaluationForm({
  employeeId,
  employeeName,
  managerName,
  department,
  designation,
  period,
  purpose,
  type,
}: EvaluationFormProps) {
  const sessionUser = getSessionUser();
  const {
    evaluation,
    items,
    goalSnapshot,
    getItem,
    setScore,
    setItemComment,
    setGoalProgress,
    comment,
    setComment,
    loading,
    saving,
    error,
    save,
    submit,
  } = useEvaluation({ employeeId, period, purpose, type });

  const firstPerson = type === 'self_review';
  const displayEmployee =
    employeeName ||
    [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(' ') ||
    'Employee';
  const displayManager =
    managerName ||
    [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(' ') ||
    'Manager';
  const displayDepartment = department || (sessionUser?.department as string) || 'Customer Support';
  const displayDesignation = designation || (sessionUser?.position as string) || 'Team member';

  const preview = useMemo(() => {
    if (!evaluation) return null;
    return scoreEvaluation({ ...evaluation, items, goalSnapshot });
  }, [evaluation, items, goalSnapshot]);

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Setting up the evaluation…</div>;
  if (error) return <div className="p-4" style={{ color: C.bad }}>{error}</div>;
  if (!evaluation || !preview) return null;

  const alreadySubmitted = evaluation.status !== 'draft';
  const { frameworkSnapshot } = preview;

  let lastPillar = '';

  return (
    <PerformancePage maxWidth={1100}>
      <PageHero
        icon={<ClipboardPen size={24} color="#fff" />}
        title={firstPerson ? 'Self-review' : 'Performance evaluation'}
        subtitle={
          firstPerson
            ? 'Rate yourself against each criterion. Your manager will moderate this before owner sign-off.'
            : 'Score the employee against the published framework, then submit for owner review.'
        }
        badge={{ value: period, label: PURPOSE_LABELS[purpose].toUpperCase() }}
      />

      <div className="row g-4">
        <div className="col-lg-8">
          <SectionCard title="Evaluation details">
            <div className="d-flex justify-content-end mb-3">
              <StatusBadge label={`Review period · ${period}`} bg={C.primaryBg} color={C.primaryDark} />
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small" style={{ color: C.muted }}>
                  Employee name
                </label>
                <input className="form-control evaluation-field" readOnly value={displayEmployee} />
              </div>
              {!firstPerson && (
                <div className="col-md-6">
                  <label className="form-label small" style={{ color: C.muted }}>
                    Manager
                  </label>
                  <input className="form-control evaluation-field" readOnly value={displayManager} />
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label small" style={{ color: C.muted }}>
                  Department
                </label>
                <input className="form-control evaluation-field" readOnly value={displayDepartment} />
              </div>
              <div className="col-md-6">
                <label className="form-label small" style={{ color: C.muted }}>
                  Designation
                </label>
                <input className="form-control evaluation-field" readOnly value={displayDesignation} />
              </div>
              <div className="col-md-6">
                <label className="form-label small" style={{ color: C.muted }}>
                  Review period
                </label>
                <input className="form-control evaluation-field" readOnly value={period} />
              </div>
              <div className="col-md-6">
                <label className="form-label small" style={{ color: C.muted }}>
                  Purpose
                </label>
                <input className="form-control evaluation-field" readOnly value={PURPOSE_LABELS[purpose]} />
              </div>
            </div>
          </SectionCard>

          {alreadySubmitted && firstPerson && (
            <AlertBanner tone="ok">
              <div className="d-flex align-items-start gap-2">
                <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>
                  Self-review submitted. Your manager has been notified and will moderate this review before sending
                  the final version to the owner.
                </span>
              </div>
            </AlertBanner>
          )}
          {alreadySubmitted && !firstPerson && (
            <AlertBanner tone="info">This evaluation has already been submitted.</AlertBanner>
          )}

          {frameworkSnapshot.categories.map((cat) => {
            const pillar = pillarForCategoryOrder(cat.order);
            const showPillarHeader = pillar !== lastPillar;
            lastPillar = pillar;
            const catResult = preview.categoryResults.find((c) => c.categoryId === cat.categoryId);

            return (
              <div key={cat.categoryId} className="mb-3">
                {showPillarHeader && (
                  <PillarHeader
                    label={PILLAR_LABELS[pillar] ?? pillar.toUpperCase()}
                    meta={pillar === 'functional' ? '5 pts each' : undefined}
                    connected
                  />
                )}

                <div
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.line}`,
                    borderTop: showPillarHeader ? 'none' : `1px solid ${C.line}`,
                    borderRadius: showPillarHeader ? '0 0 16px 16px' : 16,
                    padding: 18,
                    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 mb-0" style={{ color: C.ink }}>
                      {cat.name}
                      <span style={{ color: C.muted, fontWeight: 400 }}> ({cat.maxMarks} marks total)</span>
                    </h2>
                    <StatusBadge
                      label={(catResult?.earnedMarks ?? 0).toFixed(1)}
                      bg={C.primaryBg}
                      color={C.primaryDark}
                    />
                  </div>

                  {cat.criteria.map((crit) => {
                    const item = getItem(crit.criterionId);
                    return (
                      <ScorePicker
                        key={crit.criterionId}
                        criterionName={crit.name}
                        maxMarks={crit.maxMarks}
                        score={item?.score ?? 0}
                        comment={item?.comment}
                        disabled={alreadySubmitted}
                        firstPerson={firstPerson}
                        onScoreChange={(score) => setScore(crit.criterionId, cat.categoryId, score)}
                        onCommentChange={(c) => setItemComment(crit.criterionId, cat.categoryId, c)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          <GoalsAttainmentPanel
            goals={goalSnapshot}
            goalsEarnedMarks={preview.goalsEarnedMarks}
            goalsMaxMarks={preview.goalsMaxMarks}
            disabled={alreadySubmitted}
            onAssessedProgressChange={setGoalProgress}
          />

          <SectionCard title={firstPerson ? 'Overall comment' : "Manager's overall comment"}>
            <textarea
              className="form-control"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={alreadySubmitted}
              style={{ borderRadius: R.md, borderColor: C.line }}
            />
          </SectionCard>

          <div className="d-flex gap-2 d-lg-none mb-4">
            <button
              type="button"
              style={perfBtnSecondary}
              onClick={() => save()}
              disabled={saving || alreadySubmitted}
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          </div>
        </div>

        <div className="col-lg-4">
          <EvaluationSummary
            evaluation={preview}
            onSubmit={alreadySubmitted ? undefined : () => submit()}
            saving={saving}
            alreadySubmitted={alreadySubmitted}
          />
          <button
            type="button"
            className="w-100 mt-2 d-none d-lg-block"
            style={{ ...perfBtnSecondary, width: '100%' }}
            onClick={() => save()}
            disabled={saving || alreadySubmitted}
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </div>
    </PerformancePage>
  );
}
