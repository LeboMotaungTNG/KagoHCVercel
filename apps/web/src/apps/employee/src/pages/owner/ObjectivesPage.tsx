import { useEffect, useState } from 'react';
import { Building2, Plus, Target } from 'lucide-react';
import { createObjective, listGoals, listObjectives } from '../../api/goals.api';
import {
  EmptyState,
  PageHero,
  PerformancePage,
  SectionCard,
  perfBtnHero,
  perfBtnPrimary,
} from '../../components/PerformanceUI';
import { C, FONT_NUM, R } from '../../../../../shared/utils/employee';
import type { EmployeeGoal, OrganizationalObjective } from '../../types/goals';

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<OrganizationalObjective[]>([]);
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [period, setPeriod] = useState('2026');
  const [targetMetric, setTargetMetric] = useState('');

  const refresh = async () => {
    const [o, g] = await Promise.all([listObjectives(), listGoals()]);
    setObjectives(o);
    setGoals(g);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Objective title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createObjective({
        title: title.trim(),
        description: description.trim(),
        department: department.trim() || undefined,
        period,
        targetMetric: targetMetric.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setDepartment('');
      setTargetMetric('');
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create objective');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4" style={{ color: C.muted }}>Loading objectives…</div>;

  return (
    <PerformancePage>
      <PageHero
        icon={<Target size={24} color="#fff" />}
        title="Organisational objectives"
        subtitle="Define company or department objectives. Managers assign employee goals under these."
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} style={perfBtnHero}>
            <Plus size={16} />
            {showForm ? 'Cancel' : 'Add objective'}
          </button>
        }
      />

      {error && (
        <div style={{ background: C.badBg, color: C.bad, padding: '10px 14px', borderRadius: R.md, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {showForm && (
        <SectionCard icon={<Plus size={16} />} title="New objective">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small text-muted">Title</label>
              <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label small text-muted">Description</label>
              <textarea className="form-control" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Department (optional)</label>
              <input
                className="form-control"
                placeholder="Leave blank for company-wide"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Period</label>
              <input className="form-control" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Target metric</label>
              <input className="form-control" value={targetMetric} onChange={(e) => setTargetMetric(e.target.value)} />
            </div>
          </div>
          <button type="button" disabled={saving} onClick={handleCreate} style={{ ...perfBtnPrimary, marginTop: 16 }}>
            {saving ? 'Saving…' : 'Publish objective'}
          </button>
        </SectionCard>
      )}

      {objectives.length === 0 && !showForm && (
        <EmptyState
          icon={<Target size={28} />}
          message="No organisational objectives yet. Add one to let managers assign linked employee goals."
        />
      )}

      <div className="row g-3">
        {objectives.map((obj) => {
          const linked = goals.filter((g) => g.objectiveId === obj._id);
          const avg =
            linked.length > 0 ? linked.reduce((s, g) => s + g.progressPct, 0) / linked.length : 0;
          return (
            <div className="col-12 col-md-6" key={obj._id}>
              <SectionCard fill noMargin>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Target size={18} color={C.primary} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 20,
                      background: obj.status === 'active' ? C.okBg : C.surfaceAlt,
                      color: obj.status === 'active' ? C.ok : C.muted,
                      textTransform: 'uppercase',
                    }}
                  >
                    {obj.status}
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 16, marginBottom: 6 }}>{obj.title}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{obj.description}</div>
                <div className="d-flex align-items-center gap-2 small mb-2" style={{ color: C.text }}>
                  <Building2 size={14} />
                  {obj.department || 'Company-wide'} · {obj.period}
                </div>
                {obj.targetMetric && (
                  <div style={{ fontSize: 13, color: C.primaryDark, fontWeight: 600, marginBottom: 12 }}>
                    Target: {obj.targetMetric}
                  </div>
                )}
                <div className="d-flex justify-content-between small mb-1" style={{ color: C.muted }}>
                  <span>{linked.length} linked employee goal(s)</span>
                  <span style={{ ...FONT_NUM }}>{avg.toFixed(0)}% avg progress</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
                  <div style={{ width: `${avg}%`, height: '100%', background: C.primary }} />
                </div>
                {linked.length > 0 && (
                  <ul className="mt-3 mb-0 ps-3" style={{ fontSize: 13, color: C.text }}>
                    {linked.slice(0, 4).map((g) => (
                      <li key={g._id}>
                        {g.employeeName || g.employeeId}: {g.title} ({g.progressPct}%)
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          );
        })}
      </div>
    </PerformancePage>
  );
}
