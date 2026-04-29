import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();
const departmentController = new DepartmentController();

// All routes require authentication
router.use(authMiddleware);

// Department routes
router.post('/', departmentController.create.bind(departmentController));
router.get('/', departmentController.getAll.bind(departmentController));
router.get('/hierarchy', departmentController.getHierarchy.bind(departmentController));
router.get('/:id', departmentController.getById.bind(departmentController));
router.put('/:id', departmentController.update.bind(departmentController));
router.delete('/:id', departmentController.delete.bind(departmentController));

export default router;
