import { Router } from 'express';
import { LeaveRulesController } from '../controllers/leave-rules.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();
const leaveRulesController = new LeaveRulesController();

// All routes require authentication
router.use(authMiddleware);

// Leave rules CRUD
router.get('/', leaveRulesController.getAll.bind(leaveRulesController));
router.get('/seed', leaveRulesController.seedDefaults.bind(leaveRulesController));
router.get('/:id', leaveRulesController.getById.bind(leaveRulesController));
router.post('/', leaveRulesController.create.bind(leaveRulesController));
router.put('/:id', leaveRulesController.update.bind(leaveRulesController));
router.delete('/:id', leaveRulesController.delete.bind(leaveRulesController));
router.patch('/:id/toggle', leaveRulesController.toggleActive.bind(leaveRulesController));

// Leave cycles management within a rule
router.post('/:id/cycles', leaveRulesController.addCycle.bind(leaveRulesController));
router.put('/:id/cycles/:cycleId', leaveRulesController.updateCycle.bind(leaveRulesController));
router.delete('/:id/cycles/:cycleId', leaveRulesController.deleteCycle.bind(leaveRulesController));

export default router;
