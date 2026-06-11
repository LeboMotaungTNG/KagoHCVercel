import { Router } from 'express';
import { OwnerController } from '../controllers/owner.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();
const ownerController = new OwnerController();

router.use(authMiddleware);

// Leave policies (BCEA statutory + custom company leave types)
router.get('/leave-policies', ownerController.getLeavePolicies.bind(ownerController));
router.post('/leave-policies', ownerController.createLeavePolicy.bind(ownerController));
router.put('/leave-policies/:id', ownerController.updateLeavePolicy.bind(ownerController));
router.delete('/leave-policies/:id', ownerController.deleteLeavePolicy.bind(ownerController));

// Company settings (profile / legal / banking)
router.get('/company/settings', ownerController.getCompanySettings.bind(ownerController));
router.put('/company/settings', ownerController.updateCompanySettings.bind(ownerController));

export default router;
