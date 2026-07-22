import { PillarHeader, StatusBadge } from './PerformanceUI';
import { C, FONT_NUM, R, SHADOW } from '../../../../shared/utils/employee';
import type { SnapshotGoal } from '../types/evaluation';
import { GOALS_MAX_MARKS } from '../utils/goalScoring';

interface GoalsAttainmentPanelProps {
  goals: SnapshotGoal[];
  goalsEarnedMarks: number;
  goalsMaxMarks: number;
  disabled?: boolean;
  onAssessedProgressChange?: (goalId: string, assessedProgressPct: number) => void;
}

export default function GoalsAttainmentPanel({
  goals,
  goalsEarnedMarks,
  goalsMaxMarks,
  disabled = false,
  onAssessedProgressChange,
}: GoalsAttainmentPanelProps) {
  const max = goalsMaxMarks || GOALS_MAX_MARKS;

  return (
    <div className="mb-3">
      <PillarHeader label="GOAL ATTAINMENT" meta={`Max ${GOALS_MAX_MARKS}`} connected />

      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          borderTop: 'none',
          borderRadius: '0 0 16px 16px',
          padding: 18,
          boxShadow: SHADOW,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
          <div style={{ fontSize: 13, color: C.muted }}>
            Goals contribute {GOALS_MAX_MARKS} KPI points. Each Functional, Interpersonal, and Leadership
            criterion is scored out of {5} marks.
          </div>
          <StatusBadge
            label={`${goalsEarnedMarks.toFixed(1)} / ${max}`}
            bg={C.primaryBg}
            color={C.primaryDark}
          />
        </div>

        {goals.length === 0 && (
          <div
            style={{
              background: C.warnBg,
              color: C.warn,
              borderRadius: R.md,
              padding: '12px 14px',
              fontSize: 13,
            }}
          >
            No goals linked for this review period. Goal block scores 0 / {GOALS_MAX_MARKS}. Ask your manager to assign
            goals under Team Goals.
          </div>
        )}

        {goals.map((g) => {
          const earned = (g.maxMarks * Math.min(100, Math.max(0, g.assessedProgressPct))) / 100;
          return (
            <div
              key={g.goalId}
              style={{
                borderBottom: `1px solid ${C.line}`,
                padding: '12px 0',
              }}
            >
              <div className="d-flex justify-content-between gap-2 mb-1">
                <div>
                  <div style={{ fontWeight: 650, color: C.ink, fontSize: 14 }}>{g.title}</div>
                  {g.objectiveTitle && (
                    <div style={{ fontSize: 12, color: C.muted }}>Linked: {g.objectiveTitle}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', ...FONT_NUM, fontSize: 13, color: C.muted }}>
                  {earned.toFixed(1)} / {g.maxMarks}
                </div>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                <span style={{ fontSize: 12, color: C.muted }}>Assessed progress</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={disabled}
                  value={g.assessedProgressPct}
                  onChange={(e) => onAssessedProgressChange?.(g.goalId, Number(e.target.value))}
                  style={{ flex: '1 1 140px', accentColor: C.primary }}
                />
                <span style={{ fontWeight: 700, ...FONT_NUM, minWidth: 42 }}>{g.assessedProgressPct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden', marginTop: 8 }}>
                <div
                  style={{
                    width: `${g.assessedProgressPct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${C.primaryDark}, ${C.primaryLight})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
