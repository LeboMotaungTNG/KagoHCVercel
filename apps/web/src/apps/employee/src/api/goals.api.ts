import { http, USE_MOCKS } from './httpClient';
import { mockGoals, mockObjectives } from '../mocks/mockGoals';
import { notifyGoalAssigned } from '../../../../shared/utils/notifications';
import type {
  CreateGoalPayload,
  CreateObjectivePayload,
  EmployeeGoal,
  OrganizationalObjective,
  UpdateGoalPayload,
} from '../types/goals';

let objectivesStore = [...mockObjectives];
let goalsStore = [...mockGoals];

function sleep(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listObjectives(params?: { period?: string; status?: string }): Promise<OrganizationalObjective[]> {
  if (USE_MOCKS) {
    await sleep();
    return objectivesStore.filter((o) => {
      if (params?.period && o.period !== params.period) return false;
      if (params?.status && o.status !== params.status) return false;
      return true;
    });
  }
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return http.get(`/objectives${qs ? `?${qs}` : ''}`);
}

export async function createObjective(payload: CreateObjectivePayload): Promise<OrganizationalObjective> {
  if (USE_MOCKS) {
    await sleep();
    const now = new Date().toISOString();
    const created: OrganizationalObjective = {
      _id: `obj-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      department: payload.department,
      period: payload.period,
      status: 'active',
      targetMetric: payload.targetMetric,
      createdBy: 'current-user',
      createdAt: now,
      updatedAt: now,
    };
    objectivesStore = [...objectivesStore, created];
    return created;
  }
  return http.post('/objectives', payload);
}

export async function updateObjective(
  id: string,
  patch: Partial<CreateObjectivePayload> & { status?: OrganizationalObjective['status'] }
): Promise<OrganizationalObjective> {
  if (USE_MOCKS) {
    await sleep();
    objectivesStore = objectivesStore.map((o) =>
      o._id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o
    );
    const found = objectivesStore.find((o) => o._id === id);
    if (!found) throw new Error('Objective not found');
    return found;
  }
  return http.put(`/objectives/${id}`, patch);
}

export async function listGoals(params?: {
  employeeId?: string;
  objectiveId?: string;
  period?: string;
}): Promise<EmployeeGoal[]> {
  if (USE_MOCKS) {
    await sleep();
    return goalsStore
      .filter((g) => {
        if (params?.employeeId) {
          // Demo goals (emp-demo) surface for any logged-in user in mock mode
          const ok = g.employeeId === params.employeeId || g.employeeId === 'emp-demo';
          if (!ok) return false;
        }
        if (params?.objectiveId && g.objectiveId !== params.objectiveId) return false;
        if (params?.period && g.period !== params.period) return false;
        return true;
      })
      .map((g) =>
        params?.employeeId && g.employeeId === 'emp-demo' && params.employeeId !== 'emp-demo'
          ? { ...g, employeeId: params.employeeId }
          : g
      );
  }
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return http.get(`/goals${qs ? `?${qs}` : ''}`);
}

export async function createGoal(payload: CreateGoalPayload): Promise<EmployeeGoal> {
  if (USE_MOCKS) {
    await sleep();
    const objective = objectivesStore.find((o) => o._id === payload.objectiveId);
    if (!objective) throw new Error('Linked organisational objective is required');
    const now = new Date().toISOString();
    const role = payload.createdByRole ?? 'employee';
    const created: EmployeeGoal = {
      _id: `goal-${Date.now()}`,
      employeeId: payload.employeeId,
      employeeName: payload.employeeName,
      objectiveId: payload.objectiveId,
      title: payload.title,
      description: payload.description,
      period: payload.period,
      status: 'in_progress',
      priority: payload.priority ?? 'medium',
      progressPct: 0,
      dueDate: payload.dueDate,
      evaluationPeriod: payload.evaluationPeriod ?? payload.period,
      createdBy: 'current-user',
      createdByRole: role,
      createdAt: now,
      updatedAt: now,
    };
    goalsStore = [...goalsStore, created];

    if (role === 'manager') {
      notifyGoalAssigned({
        employeeName: payload.employeeName ?? 'Team member',
        employeeId: payload.employeeId,
        goalTitle: created.title,
        objectiveTitle: objective.title,
        period: created.period,
      });
    }

    return created;
  }
  return http.post('/goals', payload);
}

export async function updateGoal(id: string, patch: UpdateGoalPayload): Promise<EmployeeGoal> {
  if (USE_MOCKS) {
    await sleep();
    goalsStore = goalsStore.map((g) =>
      g._id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g
    );
    const found = goalsStore.find((g) => g._id === id);
    if (!found) throw new Error('Goal not found');
    return found;
  }
  return http.put(`/goals/${id}`, patch);
}

export async function getObjectiveById(id: string): Promise<OrganizationalObjective | undefined> {
  if (USE_MOCKS) {
    await sleep(50);
    return objectivesStore.find((o) => o._id === id);
  }
  return http.get(`/objectives/${id}`);
}
