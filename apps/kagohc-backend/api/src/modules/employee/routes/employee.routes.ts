import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();
const employeeController = new EmployeeController();

// All routes require authentication
router.use(authMiddleware);

// Employee CRUD routes
router.post('/', employeeController.create.bind(employeeController));
router.get('/', employeeController.getAll.bind(employeeController));
router.get('/me', employeeController.getMe.bind(employeeController));
router.get('/:id', employeeController.getById.bind(employeeController));
router.put('/:id', employeeController.update.bind(employeeController));
router.delete('/:id', employeeController.delete.bind(employeeController));
router.patch('/:id/status', employeeController.updateStatus.bind(employeeController));

export default router;
