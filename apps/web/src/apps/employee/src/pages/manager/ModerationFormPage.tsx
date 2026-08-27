import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import ScorePicker from '../../components/ScorePicker';
import EvaluationSummary from '../../components/EvaluationSummary';
import GoalsAttainmentPanel from '../../components/GoalsAttainmentPanel';
import {
  AlertBanner,
  PageHero,
  PerformancePage,
  PillarHeader,
  SectionCard,
  StatusBadge,
  perfBtnGhost,
  perfBtnSecondary,
} from '../../components/PerformanceUI';
import { useModeration } from '../../hooks/useModeration';
import { pillarForCategoryOrder } from '../../utils/scoring';
import { C, FONT_NUM, R } from '../../../../../shared/utils/employee';

const PILLAR_LABELS: Record<string, string> = {
  functional: 'FUNCTIONAL SKILLS',
  interpersonal: 'INTERPERSONAL SKILLS',
  leadership: 'LEADERSHIP SKILLS',
};

function empLabel(evaluation: {
  employeeId: string | { firstName: string; lastName: string; department: string };
}) {
  if (typeof evaluation.employeeId === 'string') return evaluation.employeeId;
  return `${evaluation.employeeId.firstName} ${evaluation.employeeId.lastName}`;
}

function deptLabel(evaluation: { employeeId: string | { department: string } }) {
  if (typeof evaluation.employeeId === 'string') return '—';
  return evaluation.employeeId.department;
}

export default function ModerationFormPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    managerEval,
    selfEval,
    preview,
    goalSnapshot,
    comment,
    setComment,
    getItem,
    getSelfItem,
    setScore,
    setItemComment,
    setGoalProgress,
    loading,
    saving,
    error,
    locked,
    save,
    submitFinal,
    changesRequested,
    ownerDecisionComment,
  } = useModeration(id);

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading review for moderation…</div>;
  if (error) return <div className="p-4" style={{ color: C.bad }}>{error}</div>;
  if (!managerEval || !preview) return <div className="p-4" style={{ color: C.bad }}>Review not found.</div>;

  const name = empLabel(managerEval);
  let lastPillar = '';

  const handleSubmitToOwner = async () => {
    await submitFinal();
    navigate('/manager/performance');
  };

  return (
    <PerformancePage maxWidth={1100}>
      <button
        type="button"
        onClick={() => navigate('/manager/performance')}
        className="mb-3 d-inline-flex align-items-center gap-2"
        style={perfBtnGhost}
      >
        <ArrowLeft size={16} />
        Back to queue
      </button>

      <PageHero
        icon={<ClipboardCheck size={24} color="#fff" />}
        title={`Moderate · ${name}`}
        subtitle={`${deptLabel(managerEval)} · ${managerEval.period} · Adjust scores where needed, add your final conclusion, then submit to the owner.`}
        badge={
          selfEval
            ? {
                value: selfEval.overallScore.toFixed(1),
                label: 'SELF SCORE',
              }
            : undefined
        }
      />

      {selfEval && (
        <AlertBanner tone="info">
          Employee submitted{' '}
          {selfEval.submittedAt ? new Date(selfEval.submittedAt).toLocaleString() : 'recently'} · Original overall:{' '}
          {selfEval.overallScore.toFixed(1)} / {selfEval.maxScore}
          {selfEval.ratingBand ? ` (${selfEval.ratingBand})` : ''}
        </AlertBanner>
      )}

      {changesRequested && ownerDecisionComment && (
        <AlertBanner tone="warn">
          <strong>Owner requested changes:</strong> {ownerDecisionComment}
        </AlertBanner>
      )}

      {locked && (
        <AlertBanner tone="ok">
          This review is {managerEval.status.replace(/_/g, ' ')} and can no longer be edited.
        </AlertBanner>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          {preview.frameworkSnapshot.categories.map((cat) => {
            const pillar = pillarForCategoryOrder(cat.order);
            const showPillar = pillar !== lastPillar;
            lastPillar = pillar;
            const catResult = preview.categoryResults.find((c) => c.categoryId === cat.categoryId);

            return (
              <div key={cat.categoryId} className="mb-3">
                {showPillar && (
                  <PillarHeader
                    label={PILLAR_LABELS[pillar] ?? pillar.toUpperCase()}
                    connected
                  />
                )}
                <div
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.line}`,
                    borderTop: showPillar ? 'none' : `1px solid ${C.line}`,
                    borderRadius: showPillar ? '0 0 16px 16px' : 16,
                    padding: 18,
                    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 mb-0" style={{ color: C.ink }}>
                      {cat.name}
                      <span style={{ color: C.muted, fontWeight: 400 }}> ({cat.maxMarks} marks)</span>
                    </h2>
                    <StatusBadge
                      label={(catResult?.earnedMarks ?? 0).toFixed(1)}
                      bg={C.primaryBg}
                      color={C.primaryDark}
                    />
                  </div>

                  {cat.criteria.map((crit) => {
                    const item = getItem(crit.criterionId);
                    const selfItem = getSelfItem(crit.criterionId);
                    const selfScore = selfItem?.score ?? 0;
                    const mgrScore = item?.score ?? 0;
                    const changed = selfScore > 0 && mgrScore > 0 && selfScore !== mgrScore;

                    return (
                      <div key={crit.criterionId}>
                        {selfEval && (
                          <div
                            className="d-flex justify-content-between small mb-1"
                            style={{ color: C.muted, ...FONT_NUM }}
                          >
                            <span>Employee score: {selfScore || '—'}</span>
                            {changed && (
                              <span style={{ color: C.warn, fontWeight: 700 }}>
                                Adjusted {selfScore} → {mgrScore}
                              </span>
                            )}
                          </div>
                        )}
                        <ScorePicker
                          criterionName={crit.name}
                          maxMarks={crit.maxMarks}
                          score={mgrScore}
                          comment={item?.comment}
                          disabled={locked}
                          onScoreChange={(score) => setScore(crit.criterionId, cat.categoryId, score)}
                          onCommentChange={(c) => setItemComment(crit.criterionId, cat.categoryId, c)}
                        />
                      </div>
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
            disabled={locked}
            onAssessedProgressChange={setGoalProgress}
          />

          {selfEval?.employeeComment && (
            <div
              className="mb-3"
              style={{
                background: C.surfaceAlt,
                borderLeft: `3px solid ${C.green}`,
                borderRadius: `0 ${R.md}px ${R.md}px 0`,
                padding: '12px 16px',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>
                EMPLOYEE OVERALL COMMENT
              </div>
              <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic', color: C.text }}>
                &ldquo;{selfEval.employeeComment}&rdquo;
              </p>
            </div>
          )}

          <SectionCard title="Manager final conclusion">
            <textarea
              className="form-control"
              rows={4}
              value={comment}
              disabled={locked}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Summarise the moderated outcome for the owner…"
              style={{ borderRadius: R.md, borderColor: C.line }}
            />
          </SectionCard>
        </div>

        <div className="col-lg-4">
          <EvaluationSummary
            evaluation={preview}
            onSubmit={locked ? undefined : () => handleSubmitToOwner()}
            saving={saving}
            alreadySubmitted={locked}
            submitLabel={
              changesRequested ? 'Resubmit revised review to owner' : 'Submit final review to owner'
            }
          />
          {!locked && (
            <button
              type="button"
              className="w-100 mt-2"
              disabled={saving}
              onClick={() => save()}
              style={{ ...perfBtnSecondary, width: '100%' }}
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          )}
          <p className="small mt-2 mb-0" style={{ color: C.muted }}>
            Submitting notifies the owner and moves this review to pending sign-off.
          </p>
        </div>
      </div>
    </PerformancePage>
  );
}
