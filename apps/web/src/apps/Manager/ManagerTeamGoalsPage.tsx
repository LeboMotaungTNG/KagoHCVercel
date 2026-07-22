import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plus, Target, UserPlus } from 'lucide-react';
import SharedLayout from './SharedLayout';
import { createGoal, listGoals, listObjectives } from '../employee/src/api/goals.api';
import type { EmployeeGoal, GoalPriority, OrganizationalObjective } from '../employee/src/types/goals';
import { C, R } from '../../shared/utils/employee';
import {
  EmptyState,
  PageHero,
  PerformancePage,
  SectionCard,
  SectionHeading,
  perfBtnHero,
  perfBtnPrimary,
  perfBtnSecondary,
} from '../employee/src/components/PerformanceUI';

const DEMO_TEAM = [
  { id: 'emp-demo', name: 'Naledi Khumalo', department: 'Customer Support', designation: 'Senior Consultant' },
  { id: 'emp-2', name: 'Thabo Nkosi', department: 'IT / Engineering', designation: 'Software Engineer' },
  { id: 'emp-3', name: 'Lerato Mokoena', department: 'Sales', designation: 'Account Executive' },
];

const TEAM_IDS = new Set(DEMO_TEAM.map((m) => m.id));

export default function ManagerTeamGoalsPage() {
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [objectives, setObjectives] = useState<OrganizationalObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  const [employeeId, setEmployeeId] = useState(DEMO_TEAM[0].id);
  const [objectiveId, setObjectiveId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [period, setPeriod] = useState('Q2 2026');
  const [dueDate, setDueDate] = useState('2026-06-30');

  const refresh = async () => {
    const [g, o] = await Promise.all([listGoals(), listObjectives({ status: 'active' })]);
    setGoals(g.filter((goal) => TEAM_IDS.has(goal.employeeId)));
    setObjectives(o);
    if (!objectiveId && o[0]) setObjectiveId(o[0]._id);
  };

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const objectiveMap = useMemo(() => {
    const map = new Map<string, OrganizationalObjective>();
    objectives.forEach((o) => map.set(o._id, o));
    return map;
  }, [objectives]);

  const nameById = useMemo(() => {
    const map = new Map(DEMO_TEAM.map((m) => [m.id, m.name]));
    return map;
  }, []);

  const visibleGoals = filterEmployeeId
    ? goals.filter((g) => g.employeeId === filterEmployeeId)
    : goals;

  const selectedMember = DEMO_TEAM.find((m) => m.id === employeeId) ?? DEMO_TEAM[0];

  const handleAssign = async () => {
    if (!title.trim() || !objectiveId || !employeeId) {
      setError('Select a team member, objective, and goal title.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createGoal({
        employeeId,
        employeeName: selectedMember.name,
        objectiveId,
        title: title.trim(),
        description: description.trim(),
        period,
        priority,
        dueDate,
        evaluationPeriod: period,
        createdByRole: 'manager',
      });
      setTitle('');
      setDescription('');
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign goal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SharedLayout title="Team Goals">
      <Helmet>
        <title>Team Goals | Kago HC</title>
      </Helmet>

      <PerformancePage>
        <PageHero
          icon={<Target size={24} color="#fff" />}
          title="Assign team goals"
          subtitle="Link each person's goals to an organisational objective. Assigned goals feed the Goals pillar (20 pts) at review time."
          actions={
            <button type="button" onClick={() => setShowForm((v) => !v)} style={perfBtnHero}>
              <UserPlus size={16} />
              {showForm ? 'Cancel' : 'Assign goal'}
            </button>
          }
        />

        <div className="mb-3 d-flex flex-wrap gap-2">
          <Link to="/manager/performance" style={{ ...perfBtnSecondary, textDecoration: 'none' }}>
            Team evaluations
          </Link>
          <span style={{ ...perfBtnPrimary, display: 'inline-flex', alignItems: 'center' }}>Team goals</span>
          <Link to="/manager/insights" style={{ ...perfBtnSecondary, textDecoration: 'none' }}>
            Insights
          </Link>
        </div>

        {error && (
          <div
            className="mb-3"
            style={{
              background: C.badBg,
              color: C.bad,
              borderRadius: R.md,
              padding: '10px 14px',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {showForm && (
          <SectionCard icon={<Target size={16} />} title="New assignment">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Team member
                </label>
                <select
                  className="form-select"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  {DEMO_TEAM.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.department}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Organisational objective
                </label>
                <select
                  className="form-select"
                  value={objectiveId}
                  onChange={(e) => setObjectiveId(e.target.value)}
                >
                  {objectives.length === 0 && <option value="">No active objectives</option>}
                  {objectives.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.title}
                      {o.department ? ` (${o.department})` : ' (Company-wide)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Goal title
                </label>
                <input
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hit 85% first-contact resolution"
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Description
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What success looks like for this person"
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Priority
                </label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as GoalPriority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Period
                </label>
                <input
                  className="form-control"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold" style={{ color: C.muted }}>
                  Due date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-3 d-flex align-items-end">
                <button
                  type="button"
                  disabled={saving || !objectives.length}
                  onClick={handleAssign}
                  style={{
                    ...perfBtnPrimary,
                    width: '100%',
                    justifyContent: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: saving || !objectives.length ? 0.7 : 1,
                    cursor: saving ? 'wait' : 'pointer',
                  }}
                >
                  <Plus size={16} />
                  {saving ? 'Assigning…' : 'Assign to employee'}
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionHeading
          icon={<Target size={16} />}
          title="Team goals"
          count={visibleGoals.length}
          actions={
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 240 }}
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
            >
              <option value="">All team members</option>
              {DEMO_TEAM.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          }
        />

        {loading && <div style={{ color: C.muted }}>Loading goals…</div>}

        {!loading && visibleGoals.length === 0 && (
          <EmptyState
            icon={<Target size={28} />}
            message="No goals yet. Assign one linked to an organisational objective."
          />
        )}

        {visibleGoals.map((goal) => {
          const obj = objectiveMap.get(goal.objectiveId);
          return (
            <SectionCard key={goal._id}>
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 16 }}>{goal.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    {goal.employeeName ?? nameById.get(goal.employeeId) ?? goal.employeeId}
                    {goal.createdByRole === 'manager' ? ' · Assigned by you' : goal.createdByRole === 'employee' ? ' · Employee-set' : ''}
                  </div>
                  {goal.description && (
                    <div style={{ fontSize: 13, color: C.text, marginTop: 6 }}>{goal.description}</div>
                  )}
                </div>
                <span style={{ fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>
                  {goal.progressPct}%
                </span>
              </div>
              <div
                style={{
                  background: C.primaryTint,
                  borderRadius: R.md,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: C.text,
                }}
              >
                <span style={{ fontWeight: 600, color: C.primaryDark }}>Objective: </span>
                {obj?.title ?? 'Unknown'}
                {obj?.department ? ` · ${obj.department}` : ' · Company-wide'}
                {` · ${goal.period}`}
                {` · ${goal.priority} priority`}
              </div>
            </SectionCard>
          );
        })}
      </PerformancePage>
    </SharedLayout>
  );
}
