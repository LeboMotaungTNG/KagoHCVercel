import { Request } from 'express';

/**
 * AuditHelper – no-op stub.
 *
 * The previous backend persisted audit events through a `LogModel`. That
 * module isn't part of the current backend, so logging is disabled here to
 * keep the ported leave/attendance controllers from spamming the console.
 * Re-introduce a real implementation if/when a log model is added.
 */
export class AuditHelper {
  static async log(
    _req: Request,
    _action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT',
    _entity: 'EMPLOYEE' | 'DEPARTMENT' | 'POSITION' | 'KPI' | 'ATTENDANCE' | 'LEAVE' | 'USER' | 'ROLE' | 'SYSTEM',
    _entityId?: string,
    _status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
    _changes?: { before?: any; after?: any },
    _details?: string,
  ): Promise<void> {
    // intentionally empty
  }
}
