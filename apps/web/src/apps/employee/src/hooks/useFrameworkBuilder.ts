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

  // Same rules as the server (framework.controller validateFrameworkWeights):
  // names required, whole marks of at least 1, each category = sum of its
  // criteria, and the categories add up to the framework's total (usually 100).
  const liveErrors = (categories: Category[], total: number): string[] => {
    const errors: string[] = [];
    const active = categories.filter((c) => (c as { isActive?: boolean }).isActive !== false);
    active.forEach((cat, ci) => {
      const label = cat.name?.trim() || `Category ${ci + 1}`;
      if (!cat.name?.trim()) errors.push(`Category ${ci + 1} needs a name.`);
      if (!Number.isInteger(cat.maxMarks) || cat.maxMarks < 1) errors.push(`'${label}': marks must be a whole number of at least 1.`);
      const criteria = cat.criteria.filter((c) => (c as { isActive?: boolean }).isActive !== false);
      criteria.forEach((c, ki) => {
        if (!c.name?.trim()) errors.push(`'${label}': criterion ${ki + 1} needs a name.`);
        if (!Number.isInteger(c.maxMarks) || c.maxMarks < 1) {
          errors.push(`'${label}' → '${c.name?.trim() || `criterion ${ki + 1}`}': marks must be a whole number of at least 1.`);
        }
      });
      const critSum = criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);
      if (critSum !== cat.maxMarks) errors.push(`'${label}': criteria add up to ${critSum}, but the category is set to ${cat.maxMarks}.`);
    });
    const catSum = active.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);
    if (catSum !== total) errors.push(`The categories add up to ${catSum} marks; they must add up to exactly ${total}.`);
    return errors;
  };

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const touched = () => { setSaveMessage(null); setSaveError(null); setServerErrors([]); };

  const updateCategoryName = (categoryId: string, name: string) => {
    if (!framework) return;
    touched();
    setFramework({ ...framework, categories: framework.categories.map((cat) => (cat._id === categoryId ? { ...cat, name } : cat)) });
  };
  const updateCriterionName = (categoryId: string, criterionId: string, name: string) => {
    if (!framework) return;
    touched();
    setFramework({
      ...framework,
      categories: framework.categories.map((cat) =>
        cat._id === categoryId ? { ...cat, criteria: cat.criteria.map((c) => (c._id === criterionId ? { ...c, name } : c)) } : cat
      ),
    });
  };

  const updateCriterionMarks = (categoryId: string, criterionId: string, maxMarks: number) => {
    if (!framework) return;
    touched();
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
    touched();
    setFramework({
      ...framework,
      categories: framework.categories.map((cat) => (cat._id === categoryId ? { ...cat, maxMarks } : cat)),
    });
  };

  /** Saves after checking; returns true when saved. Always tells the owner what happened. */
  const save = useCallback(async (): Promise<boolean> => {
    if (!framework) return false;
    const problems = liveErrors(framework.categories, framework.totalMaxMarks || 100);
    if (problems.length) {
      setSaveMessage(null);
      setSaveError(`Not saved: fix the ${problems.length} problem${problems.length === 1 ? '' : 's'} listed above first.`);
      return false;
    }
    setSaving(true);
    setSaveError(null);
    setServerErrors([]);
    try {
      const wasPublished = framework.status === 'published';
      const updated = await updateTenantFramework(framework._id, { categories: framework.categories });
      setFramework(updated);
      setSaveMessage(wasPublished
        ? `Saved as version ${updated.version}. New reviews use it from now on; reviews already started keep the version they began with.`
        : 'Saved as a draft. Publish it to make it available to employees.');
      return true;
    } catch (err) {
      const data = (err as { data?: { errors?: string[] } })?.data;
      setServerErrors(Array.isArray(data?.errors) ? data!.errors! : []);
      setSaveMessage(null);
      setSaveError(err instanceof Error ? err.message : 'The framework could not be saved.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [framework]);

  const validate = useCallback(async () => {
    if (!framework) return;
    if (!(await save())) return;
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
    liveErrors: framework ? liveErrors(framework.categories, framework.totalMaxMarks || 100) : [],
    saveMessage,
    saveError,
    serverErrors,
    updateCriterionMarks,
    updateCategoryMarks,
    updateCategoryName,
    updateCriterionName,
    save,
    validate,
    publish,
    assign,
  };
}
