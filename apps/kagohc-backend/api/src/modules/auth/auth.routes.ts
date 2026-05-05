import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware, requireAdmin } from '../../core/middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));

// Protected routes
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));
router.get('/profile', authMiddleware, (req, res, next) => authController.getProfile(req, res, next));
router.put('/profile', authMiddleware, (req, res, next) => authController.updateProfile(req, res, next));
router.post('/change-password', authMiddleware, (req, res, next) => authController.changePassword(req, res, next));

// Admin routes - create manager
router.post('/create-manager', authMiddleware, requireAdmin, (req, res, next) => authController.createManager(req, res, next));

// Get all managers (admin only)
router.get('/managers', authMiddleware, requireAdmin, (req, res, next) => authController.getManagers(req, res, next));

export default router;
