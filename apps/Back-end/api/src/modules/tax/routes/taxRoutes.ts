import { Router } from 'express';
import {
  getTaxRates,
  updateTaxRates
} from '../controllers/taxController';
import { authenticateToken, authorizeRoles } from '../../../core/middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('owner'));

router.get('/', getTaxRates);
router.put('/', updateTaxRates);

export default router;
