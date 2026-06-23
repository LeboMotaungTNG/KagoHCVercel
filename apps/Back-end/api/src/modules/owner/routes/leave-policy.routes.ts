import { Router } from 'express';
import { LeavePolicyController } from '../controllers/leave-policy.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();
const controller = new LeavePolicyController();

router.use(authMiddleware);

router.get('/',       controller.list.bind(controller));
router.post('/',      controller.create.bind(controller));
router.put('/:id',    controller.update.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

export default router;
