/** Organizational objectives set by Owner/HR — the company north star. */
export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'archived';
export type GoalStatus = 'draft' | 'in_progress' | 'on_track' | 'at_risk' | 'completed' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface OrganizationalObjective {
  _id: string;
  title: string;
  description: string;
  department?: string; // empty / undefined = company-wide
  period: string;
  status: ObjectiveStatus;
  targetMetric?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeGoal {
  _id: string;
  employeeId: string;
  employeeName?: string;
  objectiveId: string; // required link to org objective
  title: string;
  description: string;
  period: string;
  status: GoalStatus;
  priority: GoalPriority;
  progressPct: number; // 0–100
  /** Optional link to evaluation period so goals feed reviews. */
  evaluationPeriod?: string;
  dueDate?: string;
  /** Who created the goal — manager assignment vs employee self-set. */
  createdBy: string;
  createdByRole?: 'manager' | 'employee' | 'owner' | 'hr';
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectivePayload {
  title: string;
  description: string;
  department?: string;
  period: string;
  targetMetric?: string;
}

export interface CreateGoalPayload {
  employeeId: string;
  employeeName?: string;
  objectiveId: string;
  title: string;
  description: string;
  period: string;
  priority?: GoalPriority;
  dueDate?: string;
  evaluationPeriod?: string;
  createdByRole?: 'manager' | 'employee' | 'owner' | 'hr';
}

export interface UpdateGoalPayload {
  title?: string;
  description?: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  progressPct?: number;
  dueDate?: string;
  evaluationPeriod?: string;
}
