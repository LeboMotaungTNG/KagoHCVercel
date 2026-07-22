import type { Evaluation, FrameworkSnapshot, SnapshotGoal } from '../types/evaluation';
import { mockSystemFrameworks, systemFrameworkToSnapshot } from './mockFrameworks';

export const mockSnapshotCustomerSupport: FrameworkSnapshot = systemFrameworkToSnapshot(
  mockSystemFrameworks.find((f) => f._id === 'sys-fw-cs')!,
  'tenant-fw-cs-1',
  1
);

/** @deprecated Use mockSnapshotCustomerSupport */
export const mockSnapshotITFramework: FrameworkSnapshot = systemFrameworkToSnapshot(
  mockSystemFrameworks.find((f) => f._id === 'sys-fw-it')!,
  'tenant-fw-it-1',
  2
);

const nalediGoalsQ2: SnapshotGoal[] = [
  {
    goalId: 'goal-1',
    title: 'Improve first-contact resolution to 85%',
    objectiveId: 'obj-cx',
    objectiveTitle: 'Raise customer satisfaction to 90%+',
    maxMarks: 10,
    progressPct: 72,
    assessedProgressPct: 72,
    status: 'on_track',
  },
  {
    goalId: 'goal-2',
    title: 'Mentor two junior consultants',
    objectiveId: 'obj-talent',
    objectiveTitle: 'Strengthen leadership bench',
    maxMarks: 10,
    progressPct: 55,
    assessedProgressPct: 55,
    status: 'in_progress',
  },
];

const thaboGoalsQ2: SnapshotGoal[] = [
  {
    goalId: 'goal-3',
    title: 'Reduce critical bug reopen rate below 5%',
    objectiveId: 'obj-delivery',
    objectiveTitle: 'On-time delivery above 95%',
    maxMarks: 20,
    progressPct: 35,
    assessedProgressPct: 35,
    status: 'at_risk',
  },
];

/** Raw mock docs — scored on store init via scoreEvaluation. */
export const mockEvaluationsRaw: Omit<
  Evaluation,
  'categoryResults' | 'goalResults' | 'goalsEarnedMarks' | 'overallScore' | 'percentScore' | 'ratingBand' | 'ratingColor'
>[] = [
  {
    _id: 'eval-demo-manager',
    employeeId: { _id: 'emp-demo', firstName: 'Naledi', lastName: 'Khumalo', department: 'Customer Support' },
    evaluatorId: 'mgr-demo',
    period: 'Q2 2026',
    purpose: 'annual',
    type: 'manager_review',
    status: 'pending_owner',
    frameworkSnapshot: mockSnapshotCustomerSupport,
    goalSnapshot: nalediGoalsQ2,
    goalsMaxMarks: 20,
    items: [
      { criterionId: 'crit-cs-responses', categoryId: 'cat-cs-quality', score: 4, weightedMark: 0 },
      { criterionId: 'crit-cs-resolution', categoryId: 'cat-cs-quality', score: 4, weightedMark: 0 },
      { criterionId: 'crit-cs-sla', categoryId: 'cat-cs-quality', score: 3, weightedMark: 0 },
      { criterionId: 'crit-cs-punctuality', categoryId: 'cat-cs-habits', score: 5, weightedMark: 0 },
      { criterionId: 'crit-cs-attendance', categoryId: 'cat-cs-habits', score: 5, weightedMark: 0 },
      { criterionId: 'crit-cs-documentation', categoryId: 'cat-cs-habits', score: 4, weightedMark: 0 },
      { criterionId: 'crit-cs-procedures', categoryId: 'cat-cs-habits', score: 4, weightedMark: 0 },
      { criterionId: 'crit-cs-empathy', categoryId: 'cat-cs-engagement', score: 5, weightedMark: 0 },
      { criterionId: 'crit-cs-escalation', categoryId: 'cat-cs-engagement', score: 4, weightedMark: 0 },
      { criterionId: 'crit-cs-satisfaction', categoryId: 'cat-cs-engagement', score: 4, weightedMark: 0 },
      { criterionId: 'crit-ip-listening', categoryId: 'cat-interpersonal-comm', score: 4, weightedMark: 0 },
      { criterionId: 'crit-ip-written', categoryId: 'cat-interpersonal-comm', score: 4, weightedMark: 0 },
      { criterionId: 'crit-ip-feedback', categoryId: 'cat-interpersonal-comm', score: 3, weightedMark: 0 },
      { criterionId: 'crit-ip-cooperation', categoryId: 'cat-interpersonal-team', score: 4, weightedMark: 0 },
      { criterionId: 'crit-ip-conflict', categoryId: 'cat-interpersonal-team', score: 3, weightedMark: 0 },
      { criterionId: 'crit-ip-support', categoryId: 'cat-interpersonal-team', score: 4, weightedMark: 0 },
      { criterionId: 'crit-ld-proactive', categoryId: 'cat-leadership-init', score: 3, weightedMark: 0 },
      { criterionId: 'crit-ld-accountability', categoryId: 'cat-leadership-init', score: 4, weightedMark: 0 },
      { criterionId: 'crit-ld-improve', categoryId: 'cat-leadership-init', score: 3, weightedMark: 0 },
      { criterionId: 'crit-ld-mentor', categoryId: 'cat-leadership-influence', score: 3, weightedMark: 0 },
      { criterionId: 'crit-ld-decisions', categoryId: 'cat-leadership-influence', score: 4, weightedMark: 0 },
      { criterionId: 'crit-ld-vision', categoryId: 'cat-leadership-influence', score: 3, weightedMark: 0 },
    ],
    maxScore: 100,
    managerComment: 'Strong quarter with excellent customer engagement. Continue developing leadership presence.',
    submittedAt: '2026-06-28T14:00:00Z',
    createdAt: '2026-06-01T09:00:00Z',
  },
  {
    _id: 'eval-demo-self',
    employeeId: { _id: 'emp-demo', firstName: 'Naledi', lastName: 'Khumalo', department: 'Customer Support' },
    evaluatorId: 'emp-demo',
    period: 'Q2 2026',
    purpose: 'annual',
    type: 'self_review',
    status: 'submitted',
    frameworkSnapshot: mockSnapshotCustomerSupport,
    goalSnapshot: nalediGoalsQ2,
    goalsMaxMarks: 20,
    items: [
      { criterionId: 'crit-cs-responses', categoryId: 'cat-cs-quality', score: 5, weightedMark: 0 },
      { criterionId: 'crit-cs-resolution', categoryId: 'cat-cs-quality', score: 4, weightedMark: 0 },
      { criterionId: 'crit-cs-sla', categoryId: 'cat-cs-quality', score: 4, weightedMark: 0 },
    ],
    maxScore: 100,
    employeeComment: 'I met my SLA targets and supported two major product launches.',
    submittedAt: '2026-06-20T10:00:00Z',
    createdAt: '2026-06-01T09:00:00Z',
  },
  {
    _id: 'eval-mod-naledi',
    employeeId: { _id: 'emp-demo', firstName: 'Naledi', lastName: 'Khumalo', department: 'Customer Support' },
    evaluatorId: 'mgr-demo',
    period: 'Q3 2026',
    purpose: 'quarterly',
    type: 'manager_review',
    status: 'manager_in_progress',
    frameworkSnapshot: mockSnapshotCustomerSupport,
    linkedEvaluationId: 'eval-demo-self',
    goalSnapshot: nalediGoalsQ2.map((g) => ({ ...g })),
    goalsMaxMarks: 20,
    items: [
      { criterionId: 'crit-cs-responses', categoryId: 'cat-cs-quality', score: 5, weightedMark: 0 },
      { criterionId: 'crit-cs-resolution', categoryId: 'cat-cs-quality', score: 4, weightedMark: 0 },
      { criterionId: 'crit-cs-sla', categoryId: 'cat-cs-quality', score: 4, weightedMark: 0 },
    ],
    maxScore: 100,
    employeeComment: 'I met my SLA targets and supported two major product launches.',
    createdAt: '2026-06-20T10:05:00Z',
  },
  {
    _id: 'eval-at-risk-manager',
    employeeId: { _id: 'emp-2', firstName: 'Thabo', lastName: 'Nkosi', department: 'IT / Engineering' },
    evaluatorId: 'mgr-demo',
    period: 'Q2 2026',
    purpose: 'quarterly',
    type: 'manager_review',
    status: 'submitted',
    frameworkSnapshot: mockSnapshotITFramework,
    goalSnapshot: thaboGoalsQ2,
    goalsMaxMarks: 20,
    items: [],
    maxScore: 100,
    managerComment: 'Delivery quality dipped this quarter; needs structured support on reliability and ownership.',
    submittedAt: '2026-06-25T14:00:00Z',
    createdAt: '2026-06-05T09:00:00Z',
  },
];

export const mockEvaluations: Evaluation[] = mockEvaluationsRaw.map((raw) => ({
  ...raw,
  categoryResults: [],
  goalResults: [],
  goalsEarnedMarks: 0,
  overallScore: 0,
  percentScore: 0,
  ratingBand: '',
  ratingColor: '',
})) as Evaluation[];
