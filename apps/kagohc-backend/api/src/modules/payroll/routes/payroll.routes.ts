import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();
const payrollController = new PayrollController();

router.use(authMiddleware);

// Settings routes MUST come before generic routes to avoid being caught by /:id
router.get('/settings', payrollController.getSettings.bind(payrollController));
router.put('/settings', payrollController.updateSettings.bind(payrollController));

// Generic payroll routes
router.post('/generate', payrollController.generatePayrollRun.bind(payrollController));
router.get('/', payrollController.getAll.bind(payrollController));
router.get('/summary', payrollController.getSummary.bind(payrollController));

// Specific ID routes (including emp201 and payslip with prefixes)
router.get('/:id/emp201', payrollController.generateEMP201.bind(payrollController));
router.get('/:id', payrollController.getById.bind(payrollController));
router.patch('/:id/status', payrollController.updateStatus.bind(payrollController));
router.delete('/:id', payrollController.delete.bind(payrollController));
router.get('/:payrollId/employee/:employeeId/payslip', payrollController.getPayslip.bind(payrollController));

export default router;
