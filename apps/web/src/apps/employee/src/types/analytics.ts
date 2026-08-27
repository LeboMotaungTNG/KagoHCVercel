export type RecommendationSeverity = 'info' | 'watch' | 'urgent';
export type RecommendationCategory =
  | 'functional'
  | 'interpersonal'
  | 'leadership'
  | 'goal_alignment'
  | 'general';

/** Lifecycle: system suggests → manager curates → employee executes. */
export type RecommendationStatus =
  | 'suggested'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'dismissed';

export interface TrainingRecommendation {
  _id: string;
  /** Stable fingerprint used to merge regenerated candidates with decisions. */
  fingerprint: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  status: RecommendationStatus;
  title: string;
  rationale: string;
  suggestedActions: string[];
  relatedCriterionIds?: string[];
  relatedGoalIds?: string[];
  scoreSignal?: number;
  generatedAt: string;
  /** Manager who accepted / dismissed */
  decidedBy?: string;
  decidedAt?: string;
  dismissReason?: string;
  dueDate?: string;
  notes?: string;
}

/** Persisted manager decision overlay — survives recommendation regeneration. */
export interface RecommendationDecision {
  fingerprint: string;
  status: Exclude<RecommendationStatus, 'suggested'>;
  suggestedActions?: string[];
  dueDate?: string;
  notes?: string;
  dismissReason?: string;
  decidedBy: string;
  decidedAt: string;
}

export interface UpdateRecommendationPayload {
  status: Exclude<RecommendationStatus, 'suggested'>;
  suggestedActions?: string[];
  dueDate?: string;
  notes?: string;
  dismissReason?: string;
}

export interface DepartmentScoreRow {
  department: string;
  avgPercent: number;
  evaluationCount: number;
  atRiskCount: number;
}

export interface PillarTrend {
  pillar: string;
  avgPercent: number;
  lowScoreCount: number;
}

export interface PerformanceAnalytics {
  generatedAt: string;
  totalEvaluations: number;
  avgOverallPercent: number;
  pendingAcknowledgements: number;
  selfManagerGapCount: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  goalsTotal: number;
  byDepartment: DepartmentScoreRow[];
  byPillar: PillarTrend[];
  recommendations: TrainingRecommendation[];
  coachingInsights: string[];
}
