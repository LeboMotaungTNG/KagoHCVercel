import type { CategoryResult, Evaluation, FrameworkSnapshot, RatingBand } from '../types/evaluation';
import { GOALS_PILLAR, PILLAR_BY_ORDER } from '../mocks/mockFrameworks';
import { GOALS_MAX_MARKS } from './goalScoring';

export interface PillarSummary {
  key: string;
  label: string;
  earnedMarks: number;
  maxMarks: number;
}

export function countTotalCriteria(snapshot: FrameworkSnapshot | null | undefined): number {
  return (snapshot?.categories ?? []).reduce((sum, cat) => sum + (cat.criteria?.length ?? 0), 0);
}

export function countScoredCriteria(items: { score: number }[]): number {
  return items.filter((i) => i.score > 0).length;
}

export function buildPillarSummaries(
  snapshot: FrameworkSnapshot | null | undefined,
  categoryResults: CategoryResult[] | null | undefined,
  evaluation?: Pick<Evaluation, 'goalsEarnedMarks' | 'goalsMaxMarks' | 'goalSnapshot'>
): PillarSummary[] {
  const pillars = new Map<string, PillarSummary>();
  const results = categoryResults ?? [];
  const categories = snapshot?.categories ?? [];

  if (categories.length > 0) {
    categories.forEach((cat) => {
      const pillar = PILLAR_BY_ORDER[cat.order];
      if (!pillar) return;
      const result = results.find((r) => r.categoryId === cat.categoryId);
      const earned = result?.earnedMarks ?? 0;
      const existing = pillars.get(pillar.key);
      if (existing) {
        existing.earnedMarks += earned;
        existing.maxMarks += cat.maxMarks;
      } else {
        pillars.set(pillar.key, {
          key: pillar.key,
          label: pillar.label,
          earnedMarks: earned,
          maxMarks: cat.maxMarks,
        });
      }
    });
  } else if (results.length > 0) {
    // List payloads may omit frameworkSnapshot.categories — fall back to results only.
    results.forEach((result, index) => {
      const pillar = PILLAR_BY_ORDER[index + 1] ?? PILLAR_BY_ORDER[1];
      if (!pillar) return;
      const existing = pillars.get(pillar.key);
      if (existing) {
        existing.earnedMarks += result.earnedMarks ?? 0;
        existing.maxMarks += result.maxMarks ?? 0;
      } else {
        pillars.set(pillar.key, {
          key: pillar.key,
          label: pillar.label,
          earnedMarks: result.earnedMarks ?? 0,
          maxMarks: result.maxMarks ?? 0,
        });
      }
    });
  }

  const goalsMax = evaluation?.goalsMaxMarks ?? GOALS_MAX_MARKS;
  const goalsEarned = evaluation?.goalsEarnedMarks ?? 0;
  pillars.set(GOALS_PILLAR.key, {
    key: GOALS_PILLAR.key,
    label: GOALS_PILLAR.label,
    earnedMarks: goalsEarned,
    maxMarks: goalsMax || GOALS_MAX_MARKS,
  });

  return ['functional', 'interpersonal', 'leadership', 'goals']
    .map((key) => pillars.get(key))
    .filter((p): p is PillarSummary => Boolean(p));
}

export function pillarForCategoryOrder(order: number): string {
  return PILLAR_BY_ORDER[order]?.key ?? 'functional';
}

export const RATING_SCALE_LEGEND: { score: number; color: string; title: string; description: string }[] = [
  { score: 5, color: '#16a34a', title: 'Top Performer', description: 'Significantly exceeds expectations' },
  { score: 4, color: '#2563eb', title: 'Exceeds Expectations', description: 'Above average, stretched' },
  { score: 3, color: '#0d9488', title: 'Meets Expectations', description: 'On par for the role' },
  { score: 2, color: '#ea580c', title: 'Needs Improvement', description: 'Below average' },
  { score: 1, color: '#dc2626', title: 'Significantly Underperforms', description: 'PIP advised' },
];

export function previewBand(percentScore: number, bands: RatingBand[]) {
  return (
    bands.find((b) => percentScore >= b.minPct && percentScore <= b.maxPct) ??
    bands[bands.length - 1]
  );
}
