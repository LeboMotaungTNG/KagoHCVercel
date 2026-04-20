import { Request, Response, NextFunction } from 'express';
import { LogModel } from '../../modules/logs/log.model';

declare global {
  namespace Express {
    interface Request {
      auditLog?: any;
    }
  }
}

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original send/json functions
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Capture response data
  let responseBody: any;
  
  res.send = function(body: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };
  
  res.json = function(body: any): Response {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  // Log after response is sent
  res.on('finish', async () => {
    // Skip logging for non-audited paths
    if (shouldSkipAudit(req.path)) return;
    
    try {
      // Determine action based on path and method
      let action = mapMethodToAction(req.method);
      if (req.path.includes('/login')) action = 'LOGIN';
      if (req.path.includes('/register')) action = 'REGISTER';
      if (req.path.includes('/logout')) action = 'LOGOUT';
      if (req.path.includes('/refresh')) action = 'REFRESH_TOKEN';
      
      const logData: any = {
        action: action,
        entity: determineEntity(req.path),
        entityId: extractEntityId(req.path, responseBody),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || 'unknown',
        status: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS',
        details: `${req.method} - ${req.path}`,
        timestamp: new Date()
      };

      // Only add user info if authenticated
      if (req.user) {
        logData.userId = (req.user as any)._id;
        logData.userEmail = (req.user as any).email;
        logData.userName = `${(req.user as any).firstName || ''} ${(req.user as any).lastName || ''}`.trim() || 'Unknown';
        logData.userRole = (req.user as any).role;
      } else {
        // For unauthenticated requests, try to extract email from body (for login requests)
        const bodyEmail = (req.body as any)?.email;
        logData.userId = null;
        logData.userEmail = bodyEmail || 'system';
        logData.userName = bodyEmail ? bodyEmail.split('@')[0] : 'System';
        logData.userRole = 'unauthenticated';
      }
      
      // Add changes if any
      if (req.auditLog?.changes) {
        logData.changes = req.auditLog.changes;
      }
      
      await LogModel.create(logData);
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  });
  
  next();
};

function shouldSkipAudit(path: string): boolean {
  const skipPaths = ['/health', '/metrics'];
  return skipPaths.some(skipPath => path.startsWith(skipPath));
}

function mapMethodToAction(method: string): string {
  const map: Record<string, string> = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'GET': 'VIEW'
  };
  return map[method] || 'VIEW';
}

function determineEntity(path: string): string {
  const segments = path.split('/');
  for (const segment of segments) {
    const upper = segment.toUpperCase();
    if (['EMPLOYEES', 'DEPARTMENTS', 'POSITIONS', 'KPI', 'ATTENDANCE', 'LEAVE', 'AUTH', 'LOGS'].includes(upper)) {
      if (upper === 'AUTH') return 'USER';
      if (upper === 'LOGS') return 'SYSTEM';
      return upper.endsWith('S') ? upper.slice(0, -1) : upper;
    }
  }
  return 'SYSTEM';
}

function extractEntityId(path: string, responseBody: any): string | undefined {
  // Try to extract from path
  const match = path.match(/\/([a-f0-9]{24})$/);
  if (match) return match[1];
  
  // Try to extract from response body
  if (responseBody && responseBody.data?._id) {
    return responseBody.data._id;
  }
  if (responseBody && responseBody.data?.user?._id) {
    return responseBody.data.user._id;
  }
  
  return undefined;
}

