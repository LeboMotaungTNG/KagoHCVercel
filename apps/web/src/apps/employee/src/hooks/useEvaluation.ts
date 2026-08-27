import { useCallback, useEffect, useRef, useState } from 'react';
//import { createEvaluation, saveEvaluationScores, submitEvaluation } from '../api/evaluations.api';
import {
  createEvaluation,
  queryEvaluations,
  saveEvaluationScores,
  submitEvaluation,
} from '../api/evaluations.api';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const bootstrappedKey = useRef<string | null>(null);
  const evaluationRef = useRef<Evaluation | null>(null);

  useEffect(() => {
    evaluationRef.current = evaluation;
  }, [evaluation]);

  useEffect(() => {
    if (!employeeId) return;
    const key = `${employeeId}|${period}|${purpose}|${type}`;
    // Prevent React Strict Mode / remount double-create loops for the same target.
    if (bootstrappedKey.current === key && evaluationRef.current) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

//************************* */
(async () => {
  const existing = await queryEvaluations({
    employeeId,
    period,
    purpose,
    type,
  });

  if (existing.length > 0) {
    return existing[0];
  }

  return createEvaluation({
    employeeId,
    period,
    purpose,
    type,
  });
})()
  .then((evalDoc) => {
    if (cancelled) return;

    bootstrappedKey.current = key;
    setEvaluation(evalDoc);
    setItems(evalDoc.items ?? []);
    setGoalSnapshot(evalDoc.goalSnapshot ?? []);
    setComment(evalDoc.managerComment ?? evalDoc.employeeComment ?? '');
    dirtyRef.current = false;
  })
  .catch((err) => {
    if (!cancelled) {
      setError(err instanceof Error ? err.message : 'Failed to start evaluation');
    }
  })
  .finally(() => {
    if (!cancelled) setLoading(false);
  });
  return () => {
    cancelled = true;
  };
  }, [employeeId, period, purpose, type]);

  //************************* */

  const persist = useCallback(async () => {
    const current = evaluationRef.current;
    if (!current || current.status === 'signed_off')return current;
    if (current.status === 'submitted' && type === 'self_review') return current;

    setSaving(true);
    try {
      const payload =
        type === 'manager_review'
          ? { items, managerComment: comment, goalSnapshot }
          : { items, employeeComment: comment, goalSnapshot };
      const updated = await saveEvaluationScores(current._id, payload);
      setEvaluation(updated);
      setItems(updated.items ?? items);
      setGoalSnapshot(updated.goalSnapshot ?? []);
      dirtyRef.current = false;
      return updated;
    } finally {
      setSaving(false);
    }
  }, [items, comment, type, goalSnapshot]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current && !submitting) {
        void persist();
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [persist, submitting]);

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
    if (!evaluationRef.current || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await persist();
      const submitted = await submitEvaluation(evaluationRef.current._id);
      setEvaluation(submitted);
      setItems(submitted.items ?? items);
      setGoalSnapshot(submitted.goalSnapshot ?? []);
      dirtyRef.current = false;
      return submitted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evaluation');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [persist, submitting, items]);

  const getItem = (criterionId: string) => items.find((i) => i.criterionId === criterionId);


  const isReadOnly =
  evaluation?.status === 'submitted' ||
  evaluation?.status === 'signed_off';
  

  return {
    evaluation,
    items,
    goalSnapshot,
    comment,
    setComment: (value: string) => {
      if (isReadOnly) return;
      dirtyRef.current = true;
      setComment(value);
    },
    getItem,
    setScore: isReadOnly ? () => undefined : setScore,
    setItemComment: isReadOnly ? () => undefined : setItemComment,
    setGoalProgress: isReadOnly ? () => undefined : setGoalProgress,
    loading,
    saving,
    submitting,
    error,
    isReadOnly,
    save: persist,
    submit,
  };
  
};


