import express from 'express';
import { departmentController } from '../controllers/department.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);
router.post('/create', departmentController.create);
router.put('/:id', departmentController.update);
router.delete('/:id', departmentController.delete);

export default router;
