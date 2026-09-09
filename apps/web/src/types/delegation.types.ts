/**
 * Delegation of Authority Types
 * Defines the data structures for managing temporary approval delegation
 */

export interface DelegationScope {
  roles: string[];
  leaveTypes: string[];
}

export interface Delegation {
  _id: string;
  delegatorId: string;
  delegatorName: string;
  delegatorEmail: string;
  delegateId: string;
  delegateName: string;
  delegateEmail: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  scope: DelegationScope;
  reason?: string;
  createdAt: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

export interface CreateDelegationDto {
  delegateId: string;
  delegateName: string;
  delegateEmail: string;
  startDate: string;
  endDate: string;
  scope: {
    roles: string[];
    leaveTypes: string[];
  };
  reason?: string;
}

export interface RevokeDelegationDto {
  reason: string;
}

export interface CheckAuthorityDto {
  delegatorId: string;
  delegatorRole: string;
  leaveType: string;
}

export interface CheckAuthorityResponse {
  canApprove: boolean;
  delegation?: Delegation;
}

export interface DelegationAuditLog {
  _id: string;
  action: 'DELEGATION_CREATED' | 'DELEGATION_REVOKED' | 'APPROVE_DELEGATED' | 'REJECT_DELEGATED';
  message: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  resourceId: string;
  details: any;
}

export interface DelegationPagination {
  page: number;
  limit: number;
  total: number;
}

export interface DelegationListResponse {
  delegations: Delegation[];
  pagination: DelegationPagination;
}
