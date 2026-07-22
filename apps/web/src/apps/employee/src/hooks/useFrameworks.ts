// src/hooks/useFrameworks.ts
import { useCallback, useEffect, useState } from 'react';
import {
  listSystemFrameworks,
  listTenantFrameworks,
  adoptFramework,
} from '../api/frameworks.api';
import type { SystemFramework, TenantFramework } from '../types/evaluation';

export function useFrameworkLibrary() {
  const [systemFrameworks, setSystemFrameworks] = useState<SystemFramework[]>([]);
  const [tenantFrameworks, setTenantFrameworks] = useState<TenantFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

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

  const adopt = useCallback(
    async (sourceFrameworkId: string) => {
      setAdoptingId(sourceFrameworkId);
      try {
        const cloned = await adoptFramework(sourceFrameworkId);
        setTenantFrameworks((prev) => [...prev, cloned]);
        return cloned;
      } finally {
        setAdoptingId(null);
      }
    },
    []
  );

  return { systemFrameworks, tenantFrameworks, loading, error, adopt, adoptingId, reload: load };
}
