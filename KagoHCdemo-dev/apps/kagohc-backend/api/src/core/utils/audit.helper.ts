import { LogModel } from '../../modules/logs/log.model';
import { Request } from 'express';

export class AuditHelper {
  
  static async log(
    req: Request,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT',
    entity: 'EMPLOYEE' | 'DEPARTMENT' | 'POSITION' | 'KPI' | 'ATTENDANCE' | 'LEAVE' | 'USER' | 'ROLE' | 'SYSTEM',
    entityId: string | undefined,
    status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
    changes?: { before?: any; after?: any },
    details?: string
  ) {
    if (!req.user) return;
    
    try {
      await LogModel.create({
        userId: (req.user as any)._id,
        userEmail: (req.user as any).email,
        userRole: (req.user as any).role,
        action,
        entity,
        entityId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || 'unknown',
        status,
        changes,
        details
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }
}