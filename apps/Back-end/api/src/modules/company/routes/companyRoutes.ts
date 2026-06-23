import { Router } from 'express';
import { getCompanySettings, updateCompanySettings, completeOnboarding } from '../controllers/companyController';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/settings')
  .get(getCompanySettings)
  .put(updateCompanySettings);

router.post('/onboarding/complete', completeOnboarding);

export default router;
