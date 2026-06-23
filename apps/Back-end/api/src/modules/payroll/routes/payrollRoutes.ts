import { Router } from 'express';
import { authenticateToken } from '../../../core/middleware/auth.middleware';
import {
  createPayrollRun,
  getPayrollRuns,
  getPayrollRunById,
  calculatePayroll,
  approvePayroll,
  updatePayrollRun,
  generateEMP201
} from '../controllers/payrollController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Payroll run routes
router.post('/runs', createPayrollRun);
router.get('/runs', getPayrollRuns);
router.get('/runs/:id', getPayrollRunById);
router.put('/runs/:id', updatePayrollRun);
router.post('/runs/:id/calculate', calculatePayroll);
router.post('/runs/:id/approve', approvePayroll);
router.get('/runs/:id/emp201', generateEMP201);

export default router;