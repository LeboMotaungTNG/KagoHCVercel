import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plus, Target, UserPlus } from 'lucide-react';
import SharedLayout from './SharedLayout';
import { createGoal, listGoals, listObjectives } from '../employee/src/api/goals.api';
import type { EmployeeGoal, GoalPriority, OrganizationalObjective } from '../employee/src/types/goals';
import { API_URL, C, R, normalizeEmployeeList } from '../../shared/utils/employee';
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

type TeamMember = {
  id: string;
  name: string;
  department: string;
  designation: string;
};

function mapEmployee(raw: any): TeamMember | null {
  const id = String(raw?._id ?? raw?.id ?? '').trim();
  if (!id) return null;
  const first = String(raw?.firstName ?? raw?.first_name ?? '').trim();
  const last = String(raw?.lastName ?? raw?.last_name ?? '').trim();
  const full =
    `${first} ${last}`.trim() ||
    String(raw?.full_name ?? raw?.fullName ?? raw?.name ?? '').trim() ||
    String(raw?.email ?? id);
  return {
    id,
    name: full,
    department: String(raw?.department ?? raw?.departmentName ?? '—'),
    designation: String(raw?.designation ?? raw?.jobTitle ?? raw?.title ?? raw?.role ?? 'Employee'),
  };
}

function goalEmployeeId(goal: EmployeeGoal): string {
  const raw = goal.employeeId as unknown;
  if (raw && typeof raw === 'object' && '_id' in (raw as object)) {
    return String((raw as { _id: string })._id);
  }
  return String(raw ?? '');
}

export default function ManagerTeamGoalsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [objectives, setObjectives] = useState<OrganizationalObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  const [employeeId, setEmployeeId] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [period, setPeriod] = useState('Q2 2026');
  const [dueDate, setDueDate] = useState('2026-06-30');

  const refresh = async () => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [g, o, empRes] = await Promise.all([
      listGoals(),
      listObjectives({ status: 'active' }),
      fetch(`${API_URL}/employees`, { headers }).then((r) => r.json()),
    ]);

    const members = normalizeEmployeeList(empRes)
      .map(mapEmployee)
      .filter((m): m is TeamMember => Boolean(m))
      .sort((a, b) => a.name.localeCompare(b.name));

    const memberIdSet = new Set(members.map((m) => m.id));

    setTeam(members);
    setEmployeeId((prev) => (prev && members.some((m) => m.id === prev) ? prev : members[0]?.id ?? ''));
    setGoals(g.filter((goal) => memberIdSet.has(goalEmployeeId(goal))));
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
    const map = new Map(team.map((m) => [m.id, m.name]));
    return map;
  }, [team]);

  const visibleGoals = filterEmployeeId
    ? goals.filter((g) => goalEmployeeId(g) === filterEmployeeId)
    : goals;

  const selectedMember = team.find((m) => m.id === employeeId) ?? team[0];

  const handleAssign = async () => {
    if (!title.trim() || !objectiveId || !employeeId || !selectedMember) {
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
            <button type="button" onClick={() => setShowForm((v) => !v)} style={perfBtnHero} disabled={!team.length}>
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
                  {team.length === 0 && <option value="">No employees found</option>}
                  {team.map((m) => (
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
                  disabled={saving || !objectives.length || !team.length}
                  onClick={handleAssign}
                  style={{
                    ...perfBtnPrimary,
                    width: '100%',
                    justifyContent: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: saving || !objectives.length || !team.length ? 0.7 : 1,
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
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          }
        />

        {loading && <div style={{ color: C.muted }}>Loading goals…</div>}

        {!loading && team.length === 0 && (
          <EmptyState
            icon={<Target size={28} />}
            message="No employees found for your team. Add people under All Employees first."
          />
        )}

        {!loading && team.length > 0 && visibleGoals.length === 0 && (
          <EmptyState
            icon={<Target size={28} />}
            message="No goals yet. Assign one linked to an organisational objective."
          />
        )}

        {visibleGoals.map((goal) => {
          const obj = objectiveMap.get(goal.objectiveId);
          const empId = goalEmployeeId(goal);
          return (
            <SectionCard key={goal._id}>
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 16 }}>{goal.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    {goal.employeeName ?? nameById.get(empId) ?? empId}
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
