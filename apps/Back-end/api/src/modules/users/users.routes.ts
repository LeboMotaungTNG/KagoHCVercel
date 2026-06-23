import express from 'express';
import { usersController } from './users.controller';
import { authenticateToken, authorizeRoles } from '../../core/middleware/auth.middleware';

const router = express.Router();

// All user routes require authentication and owner/admin role
router.use(authenticateToken);
router.use(authorizeRoles('owner', 'admin'));

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.delete);

export default router;
