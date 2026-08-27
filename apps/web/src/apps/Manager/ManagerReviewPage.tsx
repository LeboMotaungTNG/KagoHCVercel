import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Lightbulb, PenTool, Target } from 'lucide-react';
import SharedLayout from './SharedLayout';
import { C, FONT_NUM, R } from '../../shared/utils/employee';
import { queryEvaluations } from '../employee/src/api/evaluations.api';
import type { Evaluation } from '../employee/src/types/evaluation';
import {
  EmptyState,
  PageHero,
  PerformancePage,
  SectionCard,
  CountPill,
  perfBtnHero,
  perfBtnPrimary,
} from '../employee/src/components/PerformanceUI';

function empName(e: Evaluation) {
  if (typeof e.employeeId === 'string') return e.employeeId;
  return `${e.employeeId.firstName} ${e.employeeId.lastName}`;
}

function empDept(e: Evaluation) {
  if (typeof e.employeeId === 'string') return '—';
  return e.employeeId.department;
}

export default function ManagerReviewPage() {
  const [pending, setPending] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queryEvaluations({ pendingModeration: true })
      .then(setPending)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SharedLayout title="Performance Reviews">
      <Helmet>
        <title>Performance Reviews | Kago HC</title>
      </Helmet>

      <PerformancePage>
        <PageHero
          icon={<ClipboardCheck size={24} color="#fff" />}
          title="Team evaluations"
          subtitle="Moderate employee self-reviews, then submit the final review to the owner."
          badge={{ value: pending.length, label: 'PENDING' }}
          actions={
            <>
              <Link to="/manager/team-goals" style={{ ...perfBtnHero, textDecoration: 'none' }}>
                <Target size={16} />
                Assign team goals
              </Link>
              <Link to="/manager/insights" style={{ ...perfBtnHero, textDecoration: 'none' }}>
                <Lightbulb size={16} />
                Insights & interventions
              </Link>
            </>
          }
        />

        <SectionCard
          icon={<ClipboardCheck size={16} />}
          title="Pending your moderation"
          actions={<CountPill count={pending.length} />}
        >
          {loading && <div style={{ color: C.muted }}>Loading queue…</div>}

          {!loading && pending.length === 0 && (
            <EmptyState
              icon={<ClipboardCheck size={28} />}
              message="No self-reviews waiting. When an employee submits, they appear here and in your notifications."
            />
          )}

          <div className="row g-3">
            {pending.map((e) => (
              <div className="col-12 col-md-6" key={e._id}>
                <div
                  style={{
                    border: `1px solid ${C.line}`,
                    borderRadius: R.lg,
                    padding: 16,
                    background: C.surfaceAlt,
                  }}
                >
                  <div style={{ fontWeight: 700, color: C.ink }}>{empName(e)}</div>
                  <div className="small mb-2" style={{ color: C.muted }}>
                    {empDept(e)} · {e.period} · Self score{' '}
                    <span style={{ ...FONT_NUM, fontWeight: 700 }}>
                      {e.overallScore.toFixed(1)}/{e.maxScore}
                    </span>
                  </div>
                  {e.status === 'changes_requested' && e.ownerDecisionComment && (
                    <div
                      className="small mb-2"
                      style={{
                        background: C.warnBg,
                        color: C.warn,
                        borderRadius: R.md,
                        padding: '8px 10px',
                        fontWeight: 600,
                      }}
                    >
                      Changes requested: {e.ownerDecisionComment}
                    </div>
                  )}
                  <Link
                    to={`/manager/moderate/${e._id}`}
                    className="d-inline-flex align-items-center gap-2"
                    style={{ ...perfBtnPrimary, textDecoration: 'none' }}
                  >
                    <PenTool size={14} />
                    {e.status === 'changes_requested' ? 'Revise & resubmit' : 'Moderate & finalise'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </PerformancePage>
    </SharedLayout>
  );
}
