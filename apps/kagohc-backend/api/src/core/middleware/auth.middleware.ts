import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, UnauthorizedError } from '../errors/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const userId = (decoded as any).userId || (decoded as any)._id;
    console.log('Auth middleware - decoded token:', JSON.stringify(decoded));
    console.log('Auth middleware - extracted userId:', userId);
    
    // Make sure we're attaching the user with all fields
    req.user = {
      _id: userId,
      userId: userId,
      email: (decoded as any).email,
      role: (decoded as any).role,
      firstName: (decoded as any).firstName,
      lastName: (decoded as any).lastName
    };
    
    console.log('Auth middleware - user attached:', req.user);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};;

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

