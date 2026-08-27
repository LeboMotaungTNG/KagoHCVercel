import { USE_MOCKS, http } from './httpClient';
import { queryEvaluations } from './evaluations.api';
import { listGoals } from './goals.api';
import {
  applyRecommendationDecisions,
  buildPerformanceAnalytics,
} from '../utils/recommendations';
import { notifyInterventionAssigned } from '../../../../shared/utils/notifications';
import { getCurrentUserName } from '../utils/session';
import type {
  PerformanceAnalytics,
  RecommendationDecision,
  TrainingRecommendation,
  UpdateRecommendationPayload,
} from '../types/analytics';

const DECISIONS_KEY = 'kagohc_intervention_decisions';

function readDecisions(): Record<string, RecommendationDecision> {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, RecommendationDecision>) : {};
  } catch {
    return {};
  }
}

function writeDecisions(map: Record<string, RecommendationDecision>) {
  localStorage.setItem(DECISIONS_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent('kagohc:interventions'));
}

export async function getPerformanceAnalytics(params?: {
  employeeId?: string;
  department?: string;
}): Promise<PerformanceAnalytics> {
  // Prefer client-side analytics from scoped evaluations/goals so employees
  // never receive another person's recommendations via a missing API.
  const buildLocal = async () => {
    const [evaluations, goals] = await Promise.all([
      queryEvaluations({
        employeeId: params?.employeeId,
        department: params?.department,
      }),
      listGoals({ employeeId: params?.employeeId }).catch(() => []),
    ]);
    const analytics = buildPerformanceAnalytics(evaluations, goals);
    const decisions = readDecisions();
    return {
      ...analytics,
      recommendations: applyRecommendationDecisions(analytics.recommendations, decisions),
    };
  };

  if (USE_MOCKS) {
    return buildLocal();
  }

  try {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return await http.get(`/analytics/performance${qs ? `?${qs}` : ''}`);
  } catch {
    return buildLocal();
  }
}

export async function updateRecommendation(
  fingerprint: string,
  payload: UpdateRecommendationPayload,
  context?: Pick<TrainingRecommendation, 'employeeId' | 'employeeName' | 'title'>
): Promise<RecommendationDecision> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 120));
    const map = readDecisions();
    const decision: RecommendationDecision = {
      fingerprint,
      status: payload.status,
      suggestedActions: payload.suggestedActions,
      dueDate: payload.dueDate,
      notes: payload.notes,
      dismissReason: payload.dismissReason,
      decidedBy: getCurrentUserName() || 'Manager',
      decidedAt: new Date().toISOString(),
    };
    map[fingerprint] = decision;
    writeDecisions(map);

    if (payload.status === 'accepted' && context) {
      notifyInterventionAssigned({
        employeeId: context.employeeId,
        employeeName: context.employeeName,
        title: context.title,
      });
    }

    return decision;
  }
  return http.put(`/analytics/recommendations/${encodeURIComponent(fingerprint)}`, payload);
}
