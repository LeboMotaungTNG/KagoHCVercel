import { useCallback, useState } from 'react';
import { delegationApi } from '../api/delegation.api';
import type { Delegation, CreateDelegationDto, RevokeDelegationDto } from '../types/delegation.types';
import { useAuth } from './useAuth';

export const useDelegation = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [activeDelegations, setActiveDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const resolveCurrentUserId = useCallback(() => {
    const candidateValues = [
      user?._id,
      user?.id,
      (user as any)?.userId,
      (user as any)?.employeeId,
      (user as any)?.employee?._id,
      (user as any)?.employee?.id,
      (user as any)?.profile?._id,
      (user as any)?.profile?.id,
    ];

    const resolved = candidateValues.find((value) =>
      typeof value === 'string' ? value.trim().length > 0 : Boolean(value),
    );

    return typeof resolved === 'string' ? resolved.trim() : resolved ? String(resolved).trim() : undefined;
  }, [user]);

  const fetchDelegations = useCallback(async (params: {
    type?: 'all' | 'delegated-by-me' | 'delegated-to-me';
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}) => {
    setLoading(true);
    try {
      const response = await delegationApi.getDelegations(params);
      setDelegations(response.delegations || []);
      setPagination(response.pagination || { page: 1, limit: 10, total: 0 });
      setError(null);
      return response;
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch delegations';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveDelegations = useCallback(async () => {
    const userId = resolveCurrentUserId();
    if (!userId) {
      setActiveDelegations([]);
      setError('No current user id available for active delegation lookup');
      return [];
    }

    setLoading(true);
    try {
      const response = await delegationApi.getActiveDelegationsForDelegate(userId);
      setActiveDelegations(response || []);
      setError(null);
      return response;
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch active delegations';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [resolveCurrentUserId]);

  const fetchManagementActiveDelegations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await delegationApi.getDelegations({ type: 'all', isActive: true });
      const active = (response.delegations || []).filter((delegation) => delegation.isActive);
      setError(null);
      return active;
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch active delegations';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDelegation = useCallback(async (data: CreateDelegationDto) => {
    setLoading(true);
    try {
      const response = await delegationApi.createDelegation(data);
      await fetchDelegations();
      setError(null);
      return response;
    } catch (err: any) {
      const message = err?.message || 'Failed to create delegation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDelegations]);

  const revokeDelegation = useCallback(async (delegationId: string, data: RevokeDelegationDto) => {
    setLoading(true);
    try {
      const response = await delegationApi.revokeDelegation(delegationId, data);
      await fetchDelegations();
      setError(null);
      return response;
    } catch (err: any) {
      const message = err?.message || 'Failed to revoke delegation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDelegations]);

  const getDelegation = useCallback(async (delegationId: string) => {
    setLoading(true);
    try {
      const response = await delegationApi.getDelegation(delegationId);
      setError(null);
      return response;
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch delegation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const hasActiveDelegation = useCallback((): boolean => activeDelegations.length > 0, [activeDelegations]);

  const canApproveOnBehalfOf = useCallback((delegatorId: string): boolean =>
    activeDelegations.some((d) => d.delegatorId === delegatorId && d.isActive),
    [activeDelegations],
  );

  const getActiveDelegationForDelegator = useCallback((delegatorId: string): Delegation | undefined =>
    activeDelegations.find((d) => d.delegatorId === delegatorId && d.isActive),
    [activeDelegations],
  );

  return {
    delegations,
    activeDelegations,
    loading,
    error,
    pagination,
    fetchDelegations,
    fetchActiveDelegations,
    fetchManagementActiveDelegations,
    createDelegation,
    revokeDelegation,
    getDelegation,
    hasActiveDelegation,
    canApproveOnBehalfOf,
    getActiveDelegationForDelegator,
  };
};
