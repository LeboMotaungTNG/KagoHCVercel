import RatingBadge from './RatingBadge';
import { perfBtnPrimary } from './PerformanceUI';
import {
  RATING_SCALE_LEGEND,
  buildPillarSummaries,
  countScoredCriteria,
  countTotalCriteria,
} from '../utils/scoring';
import { C, R, SHADOW } from '../../../../shared/utils/employee';
import type { Evaluation } from '../types/evaluation';

interface EvaluationSummaryProps {
  evaluation: Evaluation;
  scoredCount?: number;
  onSubmit?: () => void;
  saving?: boolean;
  alreadySubmitted?: boolean;
  submitLabel?: string;
}

export default function EvaluationSummary({
  evaluation,
  scoredCount,
  onSubmit,
  saving = false,
  alreadySubmitted = false,
  submitLabel = 'Submit evaluation',
}: EvaluationSummaryProps) {
  const { frameworkSnapshot } = evaluation;
  const totalCriteria = countTotalCriteria(frameworkSnapshot);
  const scored = scoredCount ?? countScoredCriteria(evaluation.items);
  const pillars = buildPillarSummaries(frameworkSnapshot, evaluation.categoryResults, evaluation);
  const pct =
    evaluation.maxScore > 0
      ? Math.min(100, Math.max(0, (evaluation.overallScore / evaluation.maxScore) * 100))
      : 0;
  const ringSize = 140;
  const stroke = 14;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div
      className="evaluation-summary"
      style={{
        position: 'sticky',
        top: 24,
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: R.xl,
        boxShadow: SHADOW,
        padding: 20,
        borderTop: `3px solid ${C.primary}`,
      }}
    >
      <div className="text-center mb-3">
        <div
          className="evaluation-gauge mx-auto mb-2"
          style={{
            width: ringSize,
            height: ringSize,
            position: 'relative',
          }}
        >
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            style={{ display: 'block', transform: 'rotate(-90deg)' }}
            aria-hidden
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={C.line}
              strokeWidth={stroke}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={C.primary}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.35s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div className="h4 mb-0" style={{ color: C.ink, fontWeight: 700, lineHeight: 1.1 }}>
              {evaluation.overallScore.toFixed(1)}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>of {evaluation.maxScore}</div>
            <div style={{ fontSize: 11, color: C.primaryDark, fontWeight: 700, marginTop: 2 }}>
              {pct.toFixed(0)}%
            </div>
          </div>
        </div>
        <RatingBadge label={evaluation.ratingBand} color={evaluation.ratingColor} />
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
          {scored === 0 ? 'Not yet scored' : `${scored} of ${totalCriteria} criteria scored`}
        </div>
      </div>

      <div className="mb-4">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 8,
            letterSpacing: 0.4,
          }}
        >
          Category breakdown
        </div>
        {pillars.map((pillar) => (
          <div className="d-flex justify-content-between small py-1" key={pillar.key}>
            <span style={{ color: C.text, fontWeight: 600 }}>{pillar.label}</span>
            <span style={{ color: C.muted }}>
              {pillar.earnedMarks.toFixed(1)} / {pillar.maxMarks}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 8,
            letterSpacing: 0.4,
          }}
        >
          Rating scale
        </div>
        {RATING_SCALE_LEGEND.map((row) => (
          <div className="d-flex align-items-start gap-2 small mb-2" key={row.score}>
            <span
              className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: row.color,
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {row.score}
            </span>
            <div>
              <div style={{ fontWeight: 600, color: C.ink }}>{row.title}</div>
              <div style={{ color: C.muted }}>{row.description}</div>
            </div>
          </div>
        ))}
      </div>

      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || alreadySubmitted}
          style={{ ...perfBtnPrimary, width: '100%', padding: '12px 16px', borderRadius: 12 }}
        >
          {saving ? 'Submitting…' : submitLabel}
        </button>
      )}
    </div>
  );
}
