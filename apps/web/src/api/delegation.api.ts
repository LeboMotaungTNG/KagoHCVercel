/**
 * Delegation of Authority API Service
 * Handles all API calls related to delegation management
 */

import { API_URL } from "../shared/utils/employee";
import type {
  Delegation,
  CreateDelegationDto,
  RevokeDelegationDto,
  CheckAuthorityDto,
  CheckAuthorityResponse,
  DelegationListResponse,
  DelegationAuditLog,
} from "../types/delegation.types";

const BASE_URL = `${API_URL}/leave/delegations`;

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const normalizeDelegationListResponse = (result: any): DelegationListResponse => {
  const payload = result?.data ?? result;
  const delegations = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.delegations)
      ? payload.delegations
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.results)
          ? payload.results
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
  const pagination = payload?.pagination || result?.pagination || {
    page: 1,
    limit: delegations.length || 10,
    total: delegations.length,
  };

  return { delegations, pagination };
};

export const delegationApi = {
  // 1. Create Delegation
  createDelegation: async (data: CreateDelegationDto): Promise<Delegation> => {
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error("createDelegation error:", error);
      throw error;
    }
  },

  // 2. List All Delegations
  getDelegations: async (params: {
    type?: "all" | "delegated-by-me" | "delegated-to-me";
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<DelegationListResponse> => {
    try {
      const queryString = new URLSearchParams();
      if (params.type) queryString.append("type", params.type);
      if (params.isActive !== undefined) queryString.append("isActive", String(params.isActive));
      if (params.page) queryString.append("page", String(params.page));
      if (params.limit) queryString.append("limit", String(params.limit));

      const url = `${BASE_URL}?${queryString.toString()}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return normalizeDelegationListResponse(result);
    } catch (error) {
      console.error("getDelegations error:", error);
      throw error;
    }
  },

  // 3. Get Specific Delegation
  getDelegation: async (delegationId: string): Promise<Delegation> => {
    try {
      const response = await fetch(`${BASE_URL}/${delegationId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error("getDelegation error:", error);
      throw error;
    }
  },

  // 4. Get Active Delegations for Delegate
  getActiveDelegationsForDelegate: async (delegateId: string): Promise<Delegation[]> => {
    try {
      const response = await fetch(`${BASE_URL}/delegate/${delegateId}/active`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const payload = result?.data ?? result;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.delegations)) return payload.delegations;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.results)) return payload.results;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    } catch (error) {
      console.error("getActiveDelegationsForDelegate error:", error);
      throw error;
    }
  },

  // 5. Check whether the current user may act for a delegator
  checkAuthority: async (data: CheckAuthorityDto): Promise<CheckAuthorityResponse> => {
    const response = await fetch(`${BASE_URL}/check-authority`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || result;
  },

  // 6. Approve a leave request, optionally on behalf of a delegator
  approveLeave: async (leaveId: string, onBehalfOf?: string) => {
    const response = await fetch(`${API_URL}/leave/${leaveId}/approve`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(onBehalfOf ? { onBehalfOf } : {}),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || result;
  },

  // 7. Reject a leave request, optionally on behalf of a delegator
  rejectLeave: async (leaveId: string, reason: string, onBehalfOf?: string) => {
    const response = await fetch(`${API_URL}/leave/${leaveId}/reject`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, ...(onBehalfOf ? { onBehalfOf } : {}) }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || result;
  },

  // 8. Revoke Delegation
  revokeDelegation: async (delegationId: string, data: RevokeDelegationDto): Promise<Delegation> => {
    try {
      const response = await fetch(`${BASE_URL}/${delegationId}/revoke`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error("revokeDelegation error:", error);
      throw error;
    }
  },

  // 6. Get Audit Trail
  getAuditTrail: async (params: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ logs: DelegationAuditLog[]; pagination: any }> => {
    try {
      const queryString = new URLSearchParams();
      queryString.append("action", "DELEGATION_CREATED,DELEGATION_REVOKED,APPROVE_DELEGATED,REJECT_DELEGATED");
      queryString.append("module", "leave");
      if (params.page) queryString.append("page", String(params.page));
      if (params.limit) queryString.append("limit", String(params.limit));

      const url = `${API_URL}/logs?${queryString.toString()}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || { logs: [], pagination: {} };
    } catch (error) {
      console.error("getAuditTrail error:", error);
      throw error;
    }
  },
};
