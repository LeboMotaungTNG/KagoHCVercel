import express from 'express';
import { authController } from './auth.controller';
import { authenticateToken, authorizeRoles } from '../../core/middleware/auth.middleware';

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/refresh-token', authenticateToken, authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);

// Admin/Owner only routes - for creating managers
router.post('/register-admin', authenticateToken, authorizeRoles('owner', 'admin'), authController.registerAdmin);

export default router;