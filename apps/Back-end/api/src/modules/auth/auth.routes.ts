import express from 'express';
import { authController } from './auth.controller';
import { authenticateToken, authorizeRoles } from '../../core/middleware/auth.middleware';

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/login', authController.login);
router.post('/register', authController.register);

// Token-gated but no JWT required — the invite token IS the credential.
// The invited owner sets their name + password here to activate their account.
router.post('/accept-invite', authController.acceptInvite);

// ── Protected routes ──────────────────────────────────────────────────────────
router.get('/me', authenticateToken, authController.getMe);
router.post('/refresh-token', authenticateToken, authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);

// Owner or admin only — adds admin/manager to their own company.
// ownerId is inherited from req.user on the server; not accepted from the body.
router.post(
  '/register-admin',
  authenticateToken,
  authorizeRoles('owner', 'admin'),
  authController.registerAdmin
);

export default router;
