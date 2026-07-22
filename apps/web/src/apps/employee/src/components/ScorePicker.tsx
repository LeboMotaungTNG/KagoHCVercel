import { C, R } from '../../../../shared/utils/employee';

const SCORE_COLORS: Record<number, string> = {
  1: C.bad,
  2: '#ea580c',
  3: C.teal,
  4: C.blue,
  5: C.ok,
};

interface ScorePickerProps {
  criterionName: string;
  maxMarks: number;
  score: number;
  comment?: string;
  disabled?: boolean;
  onScoreChange: (score: number) => void;
  onCommentChange: (comment: string) => void;
  firstPerson?: boolean;
}

export default function ScorePicker({
  criterionName,
  maxMarks,
  score,
  comment,
  disabled = false,
  onScoreChange,
  onCommentChange,
  firstPerson = false,
}: ScorePickerProps) {
  const previewMark = (maxMarks * score) / 5;

  return (
    <div className="py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>
            {firstPerson ? `How would you rate yourself on: ${criterionName}?` : criterionName}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>Max {maxMarks} marks</div>
        </div>
        <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>
          {score > 0 ? `${previewMark.toFixed(1)}/${maxMarks}` : `0.0/${maxMarks}`}
        </span>
      </div>

      <div className="d-flex gap-2 mb-2" role="group" aria-label={`Score for ${criterionName}`}>
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = score === value;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onScoreChange(value)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                fontWeight: 700,
                border: selected ? 'none' : `1px solid ${C.line}`,
                background: selected ? SCORE_COLORS[value] : C.surface,
                color: selected ? '#fff' : C.text,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.7 : 1,
              }}
            >
              {value}
            </button>
          );
        })}
      </div>

      <textarea
        className="form-control form-control-sm"
        placeholder="Comment (optional)"
        rows={2}
        value={comment ?? ''}
        disabled={disabled}
        onChange={(e) => onCommentChange(e.target.value)}
        style={{ background: C.surfaceAlt, borderRadius: R.sm, borderColor: C.line }}
      />
    </div>
  );
}
