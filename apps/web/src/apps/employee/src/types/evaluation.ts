// src/types/evaluation.ts
// Source of truth: KagoHC Frontend Handoff v1.0 (July 2026)
// Do NOT edit these shapes without checking with the backend team (#review-module) —
// frameworkSnapshot is the immutable record per the SRS.

export interface SnapshotCriterion {
  criterionId: string;
  name: string;
  maxMarks: number;
  order: number;
}

export interface SnapshotCategory {
  categoryId: string;
  name: string;
  maxMarks: number;
  order: number;
  criteria: SnapshotCriterion[];
}

export interface RatingBand {
  minPct: number;
  maxPct: number;
  label: string;
  color: string;
}

export interface FrameworkSnapshot {
  tenantFrameworkId: string;
  version: number;
  name: string;
  department: string;
  totalMaxMarks: number;
  scoringScale: { min: number; max: number };
  ratingBands: RatingBand[];
  categories: SnapshotCategory[];
}

export interface EvaluationItem {
  criterionId: string;
  categoryId: string;
  score: number; // 0 = not yet rated, 1-5 otherwise
  weightedMark: number; // computed by backend, read-only on the client
  comment?: string;
}

export interface CategoryResult {
  categoryId: string;
  name: string;
  earnedMarks: number;
  maxMarks: number;
  percentScore: number;
}

export type EvaluationPurpose = 'annual' | 'quarterly' | 'probation' | 'ad_hoc';
export type EvaluationType = 'manager_review' | 'self_review';
/**
 * Lifecycle (CEO workflow):
 *  employee draft → submitted (notifies manager)
 *  → manager_in_progress (manager moderates self-review)
 *  → pending_owner (manager submits final)
 *  → signed_off (owner accepts) | rejected | changes_requested (back to manager)
 * `reviewed` kept for legacy employee acknowledgement.
 */
export type EvaluationStatus =
  | 'draft'
  | 'submitted'
  | 'manager_in_progress'
  | 'pending_owner'
  | 'reviewed'
  | 'signed_off'
  | 'rejected'
  | 'changes_requested';

export type OwnerDecision = 'accepted' | 'rejected' | 'changes_requested';

export interface EvaluationEmployeeRef {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
}

export interface Evaluation {
  _id: string;
  employeeId: string | EvaluationEmployeeRef;
  evaluatorId: string;
  period: string;
  purpose: EvaluationPurpose;
  type: EvaluationType;
  status: EvaluationStatus;
  frameworkSnapshot: FrameworkSnapshot;
  /** Frozen goals for this evaluation (Option A: up to 20 marks). */
  goalSnapshot: SnapshotGoal[];
  items: EvaluationItem[];
  categoryResults: CategoryResult[];
  goalResults: GoalResult[];
  goalsEarnedMarks: number;
  goalsMaxMarks: number;
  overallScore: number;
  maxScore: number;
  percentScore: number;
  ratingBand: string;
  ratingColor: string;
  managerComment?: string;
  employeeComment?: string;
  submittedAt?: string;
  signedOffAt?: string;
  /** Owner accept / reject / request-changes decision. */
  ownerDecision?: OwnerDecision;
  /** Required when owner rejects or requests changes. */
  ownerDecisionComment?: string;
  ownerDecidedAt?: string;
  linkedEvaluationId?: string;
  createdAt: string;
}

/** Goal frozen onto an evaluation so later goal edits don't rewrite history. */
export interface SnapshotGoal {
  goalId: string;
  title: string;
  objectiveId: string;
  objectiveTitle?: string;
  maxMarks: number;
  /** Progress at snapshot time (0–100). */
  progressPct: number;
  /** Manager/employee assessed progress used for KPI (defaults to progressPct). */
  assessedProgressPct: number;
  status: string;
}

export interface GoalResult {
  goalId: string;
  title: string;
  earnedMarks: number;
  maxMarks: number;
  percentScore: number;
}

// ---- Framework-side types (needed for Screens 1 & 2, not fully spelled out
// in the handoff's mock-data block, so mirrored 1:1 from the API contract) ----

export type TenantFrameworkStatus = 'draft' | 'published';

export interface Criterion {
  _id: string;
  name: string;
  maxMarks: number;
  order?: number;
}

export interface Category {
  _id: string;
  name: string;
  maxMarks: number;
  order?: number;
  criteria: Criterion[];
}

export interface SystemFramework {
  _id: string;
  name: string;
  department: string;
  totalMaxMarks: number;
  categories: Category[];
  scoringScale: { min: number; max: number };
  ratingBands: RatingBand[];
}

export interface TenantFramework extends SystemFramework {
  sourceFrameworkId: string;
  status: TenantFrameworkStatus;
  version: number;
}

export interface ValidationResult {
  success: boolean;
  valid: boolean;
  errors: string[];
}

// ---- Generic API envelope ----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
