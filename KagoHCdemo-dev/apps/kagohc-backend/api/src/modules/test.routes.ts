import { Router } from 'express';
const router = Router();

router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

router.post('/echo', (req, res) => {
  res.json({ 
    message: 'echo', 
    received: req.body,
    timestamp: new Date().toISOString() 
  });
});

export default router;
