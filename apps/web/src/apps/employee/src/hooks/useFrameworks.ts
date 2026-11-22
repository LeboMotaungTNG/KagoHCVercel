// src/hooks/useFrameworks.ts
import { useCallback, useEffect, useState } from 'react';
import {
  listSystemFrameworks,
  listTenantFrameworks,
  adoptFramework,
  activateFramework,
} from '../api/frameworks.api';
import type { SystemFramework, TenantFramework } from '../types/evaluation';

export function useFrameworkLibrary() {
  const [systemFrameworks, setSystemFrameworks] = useState<SystemFramework[]>([]);
  const [tenantFrameworks, setTenantFrameworks] = useState<TenantFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [systemList, tenantList] = await Promise.all([
        listSystemFrameworks(),
        listTenantFrameworks(),
      ]);
      setSystemFrameworks(systemList);
      setTenantFrameworks(tenantList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load frameworks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const adopt = useCallback(async (sourceFrameworkId: string) => {
    setAdoptingId(sourceFrameworkId);
    try {
      const cloned = await adoptFramework(sourceFrameworkId);
      setTenantFrameworks((prev) => {
        if (prev.some((f) => f._id === cloned._id)) return prev;
        return [...prev, cloned];
      });
      return cloned;
    } finally {
      setAdoptingId(null);
    }
  }, []);

  const activate = useCallback(
    async (sourceFrameworkId: string, department: string) => {
      setActivatingId(sourceFrameworkId);
      try {
        const existing =
          pickTenantCopy(tenantFrameworks, sourceFrameworkId) ?? null;
        const activated = await activateFramework(sourceFrameworkId, department, existing);
        setTenantFrameworks((prev) => {
          const without = prev.filter(
            (f) => f._id !== activated._id && f.sourceFrameworkId !== sourceFrameworkId
          );
          return [...without, activated];
        });
        return activated;
      } finally {
        setActivatingId(null); 
      }
    },
    [tenantFrameworks]
  );

  return {
    systemFrameworks,
    tenantFrameworks,
    loading,
    error,
    adopt,
    activate,
    adoptingId,
    activatingId,
    reload: load,
  };
}

/**
 * The company's copy of a library framework to customise or re-assign:
 * the active (published) one first, then a draft. Archived older versions are
 * ignored — they can't be edited or assigned, which made Customise/Re-assign fail.
 */
export function pickTenantCopy<T extends { sourceFrameworkId?: string; status?: string; version?: number }>(
  list: T[],
  sourceFrameworkId: string,
): T | undefined {
  const copies = list.filter((tf) => tf.sourceFrameworkId === sourceFrameworkId && tf.status !== 'archived');
  const rank = (s?: string) => (s === 'published' ? 0 : s === 'draft' ? 1 : 2);
  return copies.sort((a, b) => rank(a.status) - rank(b.status) || (b.version ?? 0) - (a.version ?? 0))[0];
}
