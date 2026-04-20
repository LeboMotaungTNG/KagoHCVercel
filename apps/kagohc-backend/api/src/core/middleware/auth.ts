import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../modules/users/models/User';

interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

export default async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Please authenticate'
    });
  }
};
