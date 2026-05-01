import { Router } from 'express';

const router = Router();

// TODO: Implement audit log routes
router.get('/', (req, res) => {
  res.json({ message: 'Audit logs endpoint' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get audit log ${req.params.id}` });
});

export default router;
