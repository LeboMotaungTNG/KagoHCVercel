import express from 'express';
import { authenticateToken, authorizeRoles } from '../../../core/middleware/auth.middleware';
import { createCompany, listCompanies, resendInvite } from '../controllers/platform.controller';

const router = express.Router();

// All platform routes require a valid JWT AND platform_admin role.
// owner/admin/manager/user cannot reach any of these endpoints.
router.use(authenticateToken, authorizeRoles('platform_admin'));

// POST /api/v1/platform/companies
// Body: { companyName, ownerEmail, country? }
router.post('/companies', createCompany);

// GET /api/v1/platform/companies
// Query: ?status=pending_owner|Active|Inactive|Suspended
router.get('/companies', listCompanies);

// POST /api/v1/platform/companies/:companyId/resend-invite
router.post('/companies/:companyId/resend-invite', resendInvite);

export default router;
