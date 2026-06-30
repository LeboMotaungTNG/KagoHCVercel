import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    // ownerId is now part of the JWT payload (added in auth.controller signToken).
    // Controllers use req.user.ownerId to scope every DB query to the correct tenant.
    (req as any).user = {
      _id: decoded._id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      ownerId: decoded.ownerId ?? null,
    };

    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Forbidden - invalid token' });
  }
};

// Backwards-compat alias for modules ported from the previous backend
export const authMiddleware = authenticateToken;

// Role-based authorization middleware
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${user.role} role does not have permission. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};