// The organisational objectives a person can see: company-wide ones plus those
// for their department (the server filters by role). Shown on My goals and
// Team goals so objectives visibly reach managers and employees — goals are
// then assigned under them by each manager.
import { Network } from 'lucide-react';
import { SectionCard } from './PerformanceUI';
import { C, R } from '../../../../shared/utils/employee';
import type { OrganizationalObjective } from '../types/goals';

export default function ObjectivesOverview({
  objectives,
  hint,
}: {
  objectives: OrganizationalObjective[];
  /** One line under the title, e.g. what to do next. */
  hint?: string;
}) {
  return (
    <SectionCard icon={<Network size={16} />} title={`Organisational objectives (${objectives.length})`}>
      {hint && <p style={{ margin: '0 0 12px', fontSize: 13, color: C.muted }}>{hint}</p>}
      {objectives.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
          No active objectives yet. The owner sets these under Performance → Objectives.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {objectives.map((o) => (
            <div key={o._id} style={{ border: `1px solid ${C.line}`, borderRadius: R.md, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <strong style={{ fontSize: 14, color: C.text }}>{o.title}</strong>
                <span style={{ fontSize: 11.5, color: C.muted, whiteSpace: 'nowrap' }}>{o.period}</span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: o.department ? C.blue : C.green, marginTop: 2 }}>
                {o.department ? `${o.department} department` : 'Company-wide'}
              </div>
              {o.description && <div style={{ fontSize: 12.5, color: C.text, marginTop: 6 }}>{o.description}</div>}
              {o.targetMetric && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Target: {o.targetMetric}</div>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
