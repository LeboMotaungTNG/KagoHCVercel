import { Router } from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  promoteToManager,
  demoteFromManager,
  bulkImportEmployees,
  getMyEmployeeProfile,
  createEmployeeWithOnboarding,
  getOnboardingStatus,
  updateOnboardingStep,
  updateFirstDayChecklist,
} from '../controllers/employee.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Current user profile
router.get('/me', getMyEmployeeProfile);

// CRUD operations
router.post('/', createEmployee);
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

// Manager operations
router.put('/:id/promote', promoteToManager);
router.put('/:id/demote', demoteFromManager);

// Bulk operations
router.post('/bulk-import', bulkImportEmployees);

// ==============================
// Onboarding & lifecycle endpoints
// ==============================
router.post('/create-with-onboarding', createEmployeeWithOnboarding);
router.get('/:employeeId/onboarding-status', getOnboardingStatus);
router.put('/:employeeId/onboarding-step/:stepNumber', updateOnboardingStep);
router.put('/:employeeId/first-day-checklist', updateFirstDayChecklist);

// Promotion/Demotion endpoints expected by tests
router.put('/:id/promote-to-manager', promoteToManager);
router.put('/:id/demote-from-manager', demoteFromManager);

export default router;

