// src/hooks/useFrameworkBuilder.ts
import { useCallback, useEffect, useState } from 'react';
import {
  getTenantFramework,
  updateTenantFramework,
  validateFramework,
  publishFramework,
  assignFramework,
  type AssignPayload,
} from '../api/frameworks.api';
import type { Category, TenantFramework, ValidationResult } from '../types/evaluation';

export function useFrameworkBuilder(frameworkId: string) {
  const [framework, setFramework] = useState<TenantFramework | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fw = await getTenantFramework(frameworkId);
      setFramework(fw);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load framework');
    } finally {
      setLoading(false);
    }
  }, [frameworkId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live client-side check: category maxMarks = sum of criteria,
  // categories sum to 80 (goals contribute the remaining 20 toward 100).
  const liveErrors = (categories: Category[]): string[] => {
    const errors: string[] = [];
    categories.forEach((cat) => {
      const critSum = cat.criteria.reduce((sum, c) => sum + c.maxMarks, 0);
      if (critSum !== cat.maxMarks) {
        errors.push(`'${cat.name}': criteria sum to ${critSum}, category is set to ${cat.maxMarks}`);
      }
    });
    const catSum = categories.reduce((sum, c) => sum + c.maxMarks, 0);
    if (catSum !== 80) {
      errors.push(`All categories currently sum to ${catSum}, not 80 (goals add 20 to reach 100)`);
    }
    return errors;
  };

  const updateCriterionMarks = (categoryId: string, criterionId: string, maxMarks: number) => {
    if (!framework) return;
    setFramework({
      ...framework,
      categories: framework.categories.map((cat) =>
        cat._id === categoryId
          ? { ...cat, criteria: cat.criteria.map((c) => (c._id === criterionId ? { ...c, maxMarks } : c)) }
          : cat
      ),
    });
  };

  const updateCategoryMarks = (categoryId: string, maxMarks: number) => {
    if (!framework) return;
    setFramework({
      ...framework,
      categories: framework.categories.map((cat) => (cat._id === categoryId ? { ...cat, maxMarks } : cat)),
    });
  };

  const save = useCallback(async () => {
    if (!framework) return;
    setSaving(true);
    try {
      const updated = await updateTenantFramework(framework._id, { categories: framework.categories });
      setFramework(updated);
    } finally {
      setSaving(false);
    }
  }, [framework]);

  const validate = useCallback(async () => {
    if (!framework) return;
    await save();
    const result = await validateFramework(framework._id);
    setValidation(result);
    return result;
  }, [framework, save]);

  const publish = useCallback(async () => {
    if (!framework) return;
    const result = await validate();
    if (!result?.valid) return result;
    const published = await publishFramework(framework._id);
    setFramework(published);
    return result;
  }, [framework, validate]);

  const assign = useCallback(
    async (payload: AssignPayload) => {
      if (!framework) return;
      await assignFramework(framework._id, payload);
    },
    [framework]
  );

  return {
    framework,
    loading,
    saving,
    error,
    validation,
    liveErrors: framework ? liveErrors(framework.categories) : [],
    updateCriterionMarks,
    updateCategoryMarks,
    save,
    validate,
    publish,
    assign,
  };
}
