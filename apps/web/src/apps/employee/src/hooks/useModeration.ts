import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getEvaluationById,
  saveEvaluationScores,
  scoreEvaluation,
  submitToOwner,
} from '../api/evaluations.api';
import { updateGoalAssessedProgress } from '../utils/goalScoring';
import type { Evaluation, EvaluationItem, SnapshotGoal } from '../types/evaluation';

const AUTOSAVE_MS = 30_000;

export function useModeration(moderationId: string) {
  const [managerEval, setManagerEval] = useState<Evaluation | null>(null);
  const [selfEval, setSelfEval] = useState<Evaluation | null>(null);
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
    getEvaluationById(moderationId)
      .then(async (mgr) => {
        if (cancelled) return;
        setManagerEval(mgr);
        setItems(mgr.items);
        setGoalSnapshot(mgr.goalSnapshot ?? []);
        setComment(mgr.managerComment ?? '');
        if (mgr.linkedEvaluationId) {
          const self = await getEvaluationById(mgr.linkedEvaluationId);
          if (!cancelled) setSelfEval(self);
        }
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load review'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [moderationId]);

  const persist = useCallback(async () => {
    if (!managerEval) return;
    setSaving(true);
    try {
      const updated = await saveEvaluationScores(managerEval._id, {
        items,
        managerComment: comment,
        goalSnapshot,
      });
      setManagerEval(updated);
      setGoalSnapshot(updated.goalSnapshot ?? []);
      dirtyRef.current = false;
      return updated;
    } finally {
      setSaving(false);
    }
  }, [managerEval, items, comment, goalSnapshot]);

  useEffect(() => {
    const t = setInterval(() => {
      if (dirtyRef.current) persist();
    }, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [persist]);

  const setScore = (criterionId: string, categoryId: string, score: number) => {
    dirtyRef.current = true;
    setItems((prev) => {
      const exists = prev.find((i) => i.criterionId === criterionId);
      if (exists) return prev.map((i) => (i.criterionId === criterionId ? { ...i, score } : i));
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

  const submitFinal = useCallback(async () => {
    await persist();
    if (!managerEval) return;
    const finalised = await submitToOwner(managerEval._id);
    setManagerEval(finalised);
    return finalised;
  }, [persist, managerEval]);

  const preview = useMemo(() => {
    if (!managerEval) return null;
    return scoreEvaluation({ ...managerEval, items, goalSnapshot, managerComment: comment });
  }, [managerEval, items, goalSnapshot, comment]);

  const getItem = (criterionId: string) => items.find((i) => i.criterionId === criterionId);
  const getSelfItem = (criterionId: string) => selfEval?.items.find((i) => i.criterionId === criterionId);

  const locked =
    managerEval?.status === 'pending_owner' ||
    managerEval?.status === 'signed_off' ||
    managerEval?.status === 'reviewed' ||
    managerEval?.status === 'rejected';

  return {
    managerEval,
    selfEval,
    preview,
    goalSnapshot,
    comment,
    setComment: (v: string) => {
      dirtyRef.current = true;
      setComment(v);
    },
    getItem,
    getSelfItem,
    setScore,
    setItemComment,
    setGoalProgress,
    loading,
    saving,
    error,
    locked,
    changesRequested: managerEval?.status === 'changes_requested',
    ownerDecisionComment: managerEval?.ownerDecisionComment,
    save: persist,
    submitFinal,
  };
}
