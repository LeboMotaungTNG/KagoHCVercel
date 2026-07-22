import { useCallback, useEffect, useRef, useState } from 'react';
import { createEvaluation, saveEvaluationScores, submitEvaluation } from '../api/evaluations.api';
import { updateGoalAssessedProgress } from '../utils/goalScoring';
import type { Evaluation, EvaluationItem, EvaluationPurpose, EvaluationType, SnapshotGoal } from '../types/evaluation';

const AUTOSAVE_INTERVAL_MS = 30_000;

interface UseEvaluationArgs {
  employeeId: string;
  period: string;
  purpose: EvaluationPurpose;
  type: EvaluationType;
}

export function useEvaluation({ employeeId, period, purpose, type }: UseEvaluationArgs) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [goalSnapshot, setGoalSnapshot] = useState<SnapshotGoal[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    createEvaluation({ employeeId, period, purpose, type })
      .then((evalDoc) => {
        if (cancelled) return;
        setEvaluation(evalDoc);
        setItems(evalDoc.items);
        setGoalSnapshot(evalDoc.goalSnapshot ?? []);
        setComment(evalDoc.managerComment ?? evalDoc.employeeComment ?? '');
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to start evaluation'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, period, purpose, type]);

  const persist = useCallback(async () => {
    if (!evaluation) return;
    setSaving(true);
    try {
      const payload =
        type === 'manager_review'
          ? { items, managerComment: comment, goalSnapshot }
          : { items, employeeComment: comment, goalSnapshot };
      const updated = await saveEvaluationScores(evaluation._id, payload);
      setEvaluation(updated);
      setGoalSnapshot(updated.goalSnapshot ?? []);
      dirtyRef.current = false;
    } finally {
      setSaving(false);
    }
  }, [evaluation, items, comment, type, goalSnapshot]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) persist();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [persist]);

  const setScore = (criterionId: string, categoryId: string, score: number) => {
    dirtyRef.current = true;
    setItems((prev) => {
      const exists = prev.find((i) => i.criterionId === criterionId);
      if (exists) {
        return prev.map((i) => (i.criterionId === criterionId ? { ...i, score } : i));
      }
      return [...prev, { criterionId, categoryId, score, weightedMark: 0 }];
    });
  };

  const setItemComment = (criterionId: string, categoryId: string, itemComment: string) => {
    dirtyRef.current = true;
    setItems((prev) => {
      const exists = prev.find((i) => i.criterionId === criterionId);
      if (exists) {
        return prev.map((i) => (i.criterionId === criterionId ? { ...i, comment: itemComment } : i));
      }
      return [...prev, { criterionId, categoryId, score: 0, weightedMark: 0, comment: itemComment }];
    });
  };

  const setGoalProgress = (goalId: string, assessedProgressPct: number) => {
    dirtyRef.current = true;
    setGoalSnapshot((prev) => updateGoalAssessedProgress(prev, goalId, assessedProgressPct));
  };

  const submit = useCallback(async () => {
    if (!evaluation) return;
    await persist();
    const submitted = await submitEvaluation(evaluation._id);
    setEvaluation(submitted);
    setGoalSnapshot(submitted.goalSnapshot ?? []);
    return submitted;
  }, [evaluation, persist]);

  const getItem = (criterionId: string) => items.find((i) => i.criterionId === criterionId);

  return {
    evaluation,
    items,
    goalSnapshot,
    comment,
    setComment: (value: string) => {
      dirtyRef.current = true;
      setComment(value);
    },
    getItem,
    setScore,
    setItemComment,
    setGoalProgress,
    loading,
    saving,
    error,
    save: persist,
    submit,
  };
}
