// Endpoints for evaluations + CEO moderation workflow.
// Mock branch mirrors the intended backend behaviour.

import { http, USE_MOCKS } from './httpClient';
import { mockEvaluations, mockSnapshotCustomerSupport } from '../mocks/mockEvaluations';
import { listGoals, listObjectives } from './goals.api';
import { buildGoalSnapshot, GOALS_MAX_MARKS, scoreGoalSnapshot } from '../utils/goalScoring';
import {
  notifyReviewAccepted,
  notifyReviewChangesRequested,
  notifyReviewPendingOwner,
  notifyReviewRejected,
  notifySelfReviewSubmitted,
} from '../../../../shared/utils/notifications';
import { getCurrentUserName, getSessionUser } from '../utils/session';
import type {
  Evaluation,
  EvaluationItem,
  EvaluationPurpose,
  EvaluationType,
  EvaluationStatus,
  CategoryResult,
  SnapshotGoal,
} from '../types/evaluation';

function requireComment(comment: string, action: string): string {
  const trimmed = comment.trim();
  if (!trimmed) throw new Error(`A comment is required to ${action}.`);
  return trimmed;
}

function sleep(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function empIdOf(e: Evaluation): string {
  return typeof e.employeeId === 'string' ? e.employeeId : e.employeeId._id;
}

function empNameOf(e: Evaluation): string {
  if (typeof e.employeeId === 'string') return e.employeeId;
  return `${e.employeeId.firstName} ${e.employeeId.lastName}`.trim();
}

function empRefOf(e: Evaluation): Evaluation['employeeId'] {
  return e.employeeId;
}

async function snapshotGoalsFor(employeeId: string, period: string): Promise<SnapshotGoal[]> {
  const [goals, objectives] = await Promise.all([
    listGoals({ employeeId }),
    listObjectives({ status: 'active' }),
  ]);
  const objMap = new Map(objectives.map((o) => [o._id, { title: o.title }]));
  return buildGoalSnapshot(goals, period, objMap);
}

// Criteria: weightedMark = max × score ÷ 5; Goals: earned = max × assessedProgress ÷ 100
export function scoreEvaluation(evaluation: Evaluation): Evaluation {
  const { frameworkSnapshot, items } = evaluation;
  const goalSnapshot = evaluation.goalSnapshot ?? [];

  const itemsWithMarks: EvaluationItem[] = items.map((item) => {
    const criterion = frameworkSnapshot.categories
      .flatMap((c) => c.criteria)
      .find((c) => c.criterionId === item.criterionId);
    const maxMarks = criterion?.maxMarks ?? 0;
    return { ...item, weightedMark: (maxMarks * item.score) / 5 };
  });

  const categoryResults: CategoryResult[] = frameworkSnapshot.categories.map((cat) => {
    const catItems = itemsWithMarks.filter((i) => i.categoryId === cat.categoryId);
    const earnedMarks = catItems.reduce((sum, i) => sum + i.weightedMark, 0);
    const percentScore = cat.maxMarks > 0 ? (earnedMarks / cat.maxMarks) * 100 : 0;
    return { categoryId: cat.categoryId, name: cat.name, earnedMarks, maxMarks: cat.maxMarks, percentScore };
  });

  const { goalResults, goalsEarnedMarks, goalsMaxMarks } = scoreGoalSnapshot(goalSnapshot);

  const criteriaScore = categoryResults.reduce((sum, c) => sum + c.earnedMarks, 0);
  const overallScore = criteriaScore + goalsEarnedMarks;
  const maxScore = frameworkSnapshot.totalMaxMarks; // 100 = 80 criteria + 20 goals
  const percentScore = maxScore > 0 ? (overallScore / maxScore) * 100 : 0;

  const band =
    frameworkSnapshot.ratingBands.find((b) => percentScore >= b.minPct && percentScore <= b.maxPct) ??
    frameworkSnapshot.ratingBands[frameworkSnapshot.ratingBands.length - 1];

  return {
    ...evaluation,
    goalSnapshot,
    items: itemsWithMarks,
    categoryResults,
    goalResults,
    goalsEarnedMarks,
    goalsMaxMarks: goalsMaxMarks || GOALS_MAX_MARKS,
    overallScore,
    maxScore,
    percentScore,
    ratingBand: band?.label ?? '',
    ratingColor: band?.color ?? '',
  };
}

let evaluationsStore = mockEvaluations.map((e) => scoreEvaluation(e));

export async function getEvaluationById(id: string): Promise<Evaluation> {
  if (USE_MOCKS) {
    await sleep(80);
    const found = evaluationsStore.find((e) => e._id === id);
    if (!found) throw new Error('Evaluation not found');
    return found;
  }
  return http.get<Evaluation>(`/evaluations/${id}`);
}

export async function createEvaluation(payload: {
  employeeId: string;
  period: string;
  purpose: EvaluationPurpose;
  type: EvaluationType;
}): Promise<Evaluation> {
  if (USE_MOCKS) {
    await sleep();
    const existing = evaluationsStore.find((e) => {
      const empId = empIdOf(e);
      const matchesEmployee = empId === payload.employeeId || empId === 'emp-demo';
      return (
        matchesEmployee &&
        e.period === payload.period &&
        e.type === payload.type &&
        e.status === 'draft'
      );
    });
    if (existing) {
      const empId = empIdOf(existing);
      if (empId === 'emp-demo' && payload.employeeId !== 'emp-demo') {
        const rebound = { ...existing, employeeId: payload.employeeId };
        evaluationsStore = evaluationsStore.map((e) => (e._id === existing._id ? rebound : e));
        return rebound;
      }
      return existing;
    }

    const draft: Evaluation = {
      _id: `eval-${Date.now()}`,
      employeeId: payload.employeeId,
      evaluatorId: 'current-user',
      period: payload.period,
      purpose: payload.purpose,
      type: payload.type,
      status: 'draft',
      frameworkSnapshot: mockSnapshotCustomerSupport,
      goalSnapshot: await snapshotGoalsFor(payload.employeeId, payload.period),
      items: [],
      categoryResults: [],
      goalResults: [],
      goalsEarnedMarks: 0,
      goalsMaxMarks: GOALS_MAX_MARKS,
      overallScore: 0,
      maxScore: mockSnapshotCustomerSupport.totalMaxMarks,
      percentScore: 0,
      ratingBand: '',
      ratingColor: '',
      createdAt: new Date().toISOString(),
    };
    evaluationsStore = [...evaluationsStore, scoreEvaluation(draft)];
    return evaluationsStore.find((e) => e._id === draft._id)!;
  }
  return http.post<Evaluation>('/evaluations', payload);
}

export async function saveEvaluationScores(
  id: string,
  payload: {
    items: EvaluationItem[];
    managerComment?: string;
    employeeComment?: string;
    goalSnapshot?: SnapshotGoal[];
  }
): Promise<Evaluation> {
  if (USE_MOCKS) {
    await sleep();
    evaluationsStore = evaluationsStore.map((e) => {
      if (e._id !== id) return e;
      const merged = {
        ...e,
        items: payload.items,
        goalSnapshot: payload.goalSnapshot ?? e.goalSnapshot ?? [],
        managerComment: payload.managerComment ?? e.managerComment,
        employeeComment: payload.employeeComment ?? e.employeeComment,
        status:
          e.type === 'manager_review' && e.status === 'submitted'
            ? ('manager_in_progress' as EvaluationStatus)
            : e.status === 'draft' && e.type === 'manager_review' && e.linkedEvaluationId
              ? ('manager_in_progress' as EvaluationStatus)
              : e.status,
      };
      return scoreEvaluation(merged);
    });
    return evaluationsStore.find((e) => e._id === id)!;
  }
  return http.put<Evaluation>(`/evaluations/${id}`, payload);
}

/** Employee submits self-review → manager notified + moderation draft created. */
export async function submitEvaluation(id: string): Promise<Evaluation> {
  if (USE_MOCKS) {
    await sleep();
    const current = evaluationsStore.find((e) => e._id === id);
    if (!current) throw new Error('Evaluation not found');

    const submitted: Evaluation = {
      ...scoreEvaluation(current),
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    evaluationsStore = evaluationsStore.map((e) => (e._id === id ? submitted : e));

    if (submitted.type === 'self_review') {
      const existingModeration = evaluationsStore.find(
        (e) =>
          e.type === 'manager_review' &&
          e.linkedEvaluationId === submitted._id &&
          (e.status === 'draft' || e.status === 'manager_in_progress' || e.status === 'submitted')
      );

      let moderation = existingModeration;
      if (!moderation) {
        moderation = scoreEvaluation({
          _id: `eval-mod-${Date.now()}`,
          employeeId: empRefOf(submitted),
          evaluatorId: 'current-manager',
          period: submitted.period,
          purpose: submitted.purpose,
          type: 'manager_review',
          status: 'manager_in_progress',
          frameworkSnapshot: submitted.frameworkSnapshot,
          goalSnapshot: (submitted.goalSnapshot ?? []).map((g) => ({ ...g })),
          items: submitted.items.map((i) => ({ ...i })),
          categoryResults: [],
          goalResults: [],
          goalsEarnedMarks: 0,
          goalsMaxMarks: GOALS_MAX_MARKS,
          overallScore: 0,
          maxScore: submitted.maxScore,
          percentScore: 0,
          ratingBand: '',
          ratingColor: '',
          linkedEvaluationId: submitted._id,
          employeeComment: submitted.employeeComment,
          createdAt: new Date().toISOString(),
        });
        evaluationsStore = [...evaluationsStore, moderation];
      }

      const session = getSessionUser();
      const name =
        empNameOf(submitted) ||
        [session?.firstName, session?.lastName].filter(Boolean).join(' ') ||
        getCurrentUserName() ||
        'An employee';

      notifySelfReviewSubmitted({
        employeeName: name,
        employeeId: empIdOf(submitted),
        evaluationId: submitted._id,
        period: submitted.period,
        moderationId: moderation._id,
      });
    }

    return submitted;
  }
  return http.post<Evaluation>(`/evaluations/${id}/submit`);
}

/** Manager submits moderated final review to owner. */
export async function submitToOwner(id: string): Promise<Evaluation> {
  if (USE_MOCKS) {
    await sleep();
    const current = evaluationsStore.find((e) => e._id === id);
    if (!current) throw new Error('Evaluation not found');
    if (current.type !== 'manager_review') {
      throw new Error('Only manager reviews can be submitted to the owner');
    }

    const finalised = scoreEvaluation({
      ...current,
      status: 'pending_owner',
      submittedAt: current.submittedAt ?? new Date().toISOString(),
      ownerDecision: undefined,
      ownerDecisionComment: undefined,
      ownerDecidedAt: undefined,
    });
    evaluationsStore = evaluationsStore.map((e) => (e._id === id ? finalised : e));

    notifyReviewPendingOwner({
      employeeName: empNameOf(finalised),
      employeeId: empIdOf(finalised),
      evaluationId: finalised._id,
      period: finalised.period,
    });

    return finalised;
  }
  return http.post<Evaluation>(`/evaluations/${id}/submit-to-owner`);
}

/** Owner accepts (signs off) the final review. */
export async function signOffEvaluation(id: string): Promise<Evaluation> {
  if (USE_MOCKS) {
    await sleep();
    const current = evaluationsStore.find((e) => e._id === id);
    if (!current) throw new Error('Evaluation not found');
    if (current.status !== 'pending_owner') {
      throw new Error('Only reviews pending owner approval can be accepted');
    }
    const updated: Evaluation = {
      ...current,
      status: 'signed_off',
      ownerDecision: 'accepted',
      signedOffAt: new Date().toISOString(),
      ownerDecidedAt: new Date().toISOString(),
    };
    evaluationsStore = evaluationsStore.map((e) => (e._id === id ? updated : e));
    notifyReviewAccepted({
      employeeName: empNameOf(updated),
      evaluationId: updated._id,
      period: updated.period,
    });
    return updated;
  }
  return http.post<Evaluation>(`/evaluations/${id}/sign-off`);
}

/** Owner rejects the final review — comment required. */
export async function rejectEvaluation(id: string, comment: string): Promise<Evaluation> {
  const reason = requireComment(comment, 'reject this review');
  if (USE_MOCKS) {
    await sleep();
    const current = evaluationsStore.find((e) => e._id === id);
    if (!current) throw new Error('Evaluation not found');
    if (current.status !== 'pending_owner') {
      throw new Error('Only reviews pending owner approval can be rejected');
    }
    const updated: Evaluation = {
      ...current,
      status: 'rejected',
      ownerDecision: 'rejected',
      ownerDecisionComment: reason,
      ownerDecidedAt: new Date().toISOString(),
    };
    evaluationsStore = evaluationsStore.map((e) => (e._id === id ? updated : e));
    notifyReviewRejected({
      employeeName: empNameOf(updated),
      evaluationId: updated._id,
      period: updated.period,
      comment: reason,
    });
    return updated;
  }
  return http.post<Evaluation>(`/evaluations/${id}/reject`, { comment: reason });
}

/** Owner requests changes — returns review to manager; comment required. */
export async function requestChangesEvaluation(id: string, comment: string): Promise<Evaluation> {
  const reason = requireComment(comment, 'request changes');
  if (USE_MOCKS) {
    await sleep();
    const current = evaluationsStore.find((e) => e._id === id);
    if (!current) throw new Error('Evaluation not found');
    if (current.status !== 'pending_owner') {
      throw new Error('Only reviews pending owner approval can be sent back');
    }
    const updated: Evaluation = {
      ...current,
      status: 'changes_requested',
      ownerDecision: 'changes_requested',
      ownerDecisionComment: reason,
      ownerDecidedAt: new Date().toISOString(),
    };
    evaluationsStore = evaluationsStore.map((e) => (e._id === id ? updated : e));
    notifyReviewChangesRequested({
      employeeName: empNameOf(updated),
      evaluationId: updated._id,
      period: updated.period,
      comment: reason,
    });
    return updated;
  }
  return http.post<Evaluation>(`/evaluations/${id}/request-changes`, { comment: reason });
}

export async function queryEvaluations(params: {
  employeeId?: string;
  period?: string;
  type?: EvaluationType;
  status?: EvaluationStatus;
  department?: string;
  /** Manager moderation inbox */
  pendingModeration?: boolean;
  pendingOwner?: boolean;
}): Promise<Evaluation[]> {
  if (USE_MOCKS) {
    await sleep();
    return evaluationsStore.filter((e) => {
      const empId = empIdOf(e);
      if (params.employeeId) {
        const matches =
          empId === params.employeeId || (empId === 'emp-demo' && params.employeeId !== 'emp-demo');
        if (!matches) return false;
      }
      if (params.period && e.period !== params.period) return false;
      if (params.type && e.type !== params.type) return false;
      if (params.status && e.status !== params.status) return false;
      if (params.pendingModeration) {
        if (e.type !== 'manager_review') return false;
        if (!e.linkedEvaluationId) return false;
        if (
          e.status !== 'manager_in_progress' &&
          e.status !== 'draft' &&
          e.status !== 'submitted' &&
          e.status !== 'changes_requested'
        ) {
          return false;
        }
      }
      if (params.pendingOwner) {
        if (e.status !== 'pending_owner') return false;
      }
      if (params.department) {
        const dept = typeof e.employeeId === 'string' ? undefined : e.employeeId.department;
        if (dept !== params.department) return false;
      }
      return true;
    });
  }
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== false)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return http.get<Evaluation[]>(`/evaluations?${qs}`);
}
