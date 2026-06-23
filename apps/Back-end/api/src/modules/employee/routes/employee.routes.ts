import express from 'express';
import {
  getMyEmployeeProfile,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  createEmployee,
  bulkImportEmployees,
  createEmployeeWithOnboarding,
  updateOnboardingStep,
  completeProbation,
  updateFirstDayChecklist,
  getOnboardingStatus,
  promoteToManager,
  demoteFromManager,
} from '../controllers/employee.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// All routes require authentication
router.use(authenticateToken);

// ========================================
// LEVEL 1: NON-PARAMETERIZED ROUTES
// ========================================

// GET routes - exact matches only
router.get('/me', getMyEmployeeProfile);
router.get('/', getEmployees);  // Supports ?search= and ?isManager=true|false

// Specific POST routes (no parameters)
router.post('/create-with-onboarding', createEmployeeWithOnboarding);
router.post('/bulk', bulkImportEmployees);
router.post('/onboarding/process-bulk', bulkImportEmployees);
router.post('/onboarding/save-draft', createEmployee);
router.post('/onboarding/extract-document', upload.single('document'), (req, res) => {
  res.json({ success: true, data: { employees: [] }, message: 'Document extraction placeholder' });
});

// ========================================
// LEVEL 2: PARAMETERIZED ROUTES WITH MULTIPLE PARAMS
// (These are more specific than single :id parameter)
// ========================================

router.put('/:employeeId/onboarding-step/:stepNumber', updateOnboardingStep);
router.put('/:employeeId/complete-probation', completeProbation);
router.put('/:employeeId/first-day-checklist', updateFirstDayChecklist);

// ========================================
// LEVEL 3: SINGLE PARAMETER ROUTES WITH NESTED PATHS
// (Multi-level routes like /:id/promote-to-manager)
// ========================================

router.get('/:employeeId/onboarding-status', getOnboardingStatus);
router.put('/:id/promote-to-manager', promoteToManager);
router.put('/:id/demote-from-manager', demoteFromManager);

// ========================================
// LEVEL 4: GENERIC SINGLE PARAMETER ROUTES
// (These catch-all routes MUST come LAST)
// ========================================

router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
