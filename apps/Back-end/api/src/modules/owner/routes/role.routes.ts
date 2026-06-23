import express from 'express';
import { roleController } from '../controllers/role.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.post('/create', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);

export default router;
