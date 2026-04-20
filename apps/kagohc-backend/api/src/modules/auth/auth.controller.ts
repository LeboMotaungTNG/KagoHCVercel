import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '../../core/utils/response';
import { AppError } from '../../core/errors/AppError';
import { AuditHelper } from '../../core/utils/audit.helper';

const authService = new AuthService();

export class AuthController {
  
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      
      // Log successful registration
      await AuditHelper.log(req, 'CREATE', 'USER', result.user._id.toString(), 'SUCCESS');
      
      successResponse(res, 201, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      // Log successful login
      await AuditHelper.log(req, 'LOGIN', 'USER', result.user._id.toString(), 'SUCCESS');
      
      successResponse(res, 200, 'Login successful', result);
    } catch (error) {
      // Log failed login attempt
      await AuditHelper.log(
        req, 
        'LOGIN', 
        'USER', 
        undefined, 
        'FAILURE', 
        undefined, 
        'Invalid credentials'
      ).catch(logError => console.error('Failed to log login attempt:', logError));
      
      next(error);
    }
  }
  
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      successResponse(res, 200, 'Token refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      
      // Log logout
      if (req.user) {
        await AuditHelper.log(req, 'LOGOUT', 'USER', (req.user as any)._id, 'SUCCESS');
      }
      
      successResponse(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
  
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const user = await authService.getProfile(userId);
      
      successResponse(res, 200, 'Profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }
  
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const updates = req.body;
      
      const user = await authService.updateProfile(userId, updates);
      
      // Log profile update
      await AuditHelper.log(req, 'UPDATE', 'USER', userId, 'SUCCESS', { after: updates });
      
      successResponse(res, 200, 'Profile updated successfully', { user });
    } catch (error) {
      next(error);
    }
  }
  
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { currentPassword, newPassword } = req.body;
      
      await authService.changePassword(userId, currentPassword, newPassword);
      
      // Log password change
      await AuditHelper.log(req, 'UPDATE', 'USER', userId, 'SUCCESS', undefined, 'Password changed');
      
      successResponse(res, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}
