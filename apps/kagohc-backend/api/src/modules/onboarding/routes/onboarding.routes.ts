import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';

const router = Router();

// TEMPORARY: No auth for testing
router.post('/employee', onboardingController.createEmployee);
router.post('/process-bulk', onboardingController.processBulk);
router.get('/employees', onboardingController.getAllEmployees);
router.post('/save-draft', onboardingController.saveDraft);
router.get('/drafts', onboardingController.getDrafts);

export default router;
