import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();
const leaveController = new LeaveController();

// All routes require authentication
router.use(authMiddleware);

// Leave routes
router.post('/', leaveController.create.bind(leaveController));
router.get('/', leaveController.getAll.bind(leaveController));
// Alias used by the employee/owner UIs – same payload as GET '/'
router.get('/requests', leaveController.getAll.bind(leaveController));
router.get('/types', leaveController.getTypes.bind(leaveController));
router.get('/stats', leaveController.getStats.bind(leaveController));
// Balance for the currently authenticated employee (no id needed)
router.get('/balance', leaveController.getBalance.bind(leaveController));
router.get('/balance/:employeeId', leaveController.getBalance.bind(leaveController));
router.get('/leave-id/:leaveId', leaveController.getByLeaveId.bind(leaveController));
router.get('/:id', leaveController.getById.bind(leaveController));
router.put('/:id', leaveController.update.bind(leaveController));
router.delete('/:id', leaveController.delete.bind(leaveController));

// Status update routes
router.patch('/:id/approve', leaveController.approve.bind(leaveController));
router.patch('/:id/reject', leaveController.reject.bind(leaveController));
router.patch('/:id/cancel', leaveController.cancel.bind(leaveController));

export default router;
