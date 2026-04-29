import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();

// All attendance routes require authentication
router.use(authMiddleware);

router.get('/', attendanceController.getAllAttendance);
router.get('/today', attendanceController.getTodayAttendance);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOutToday);
router.put('/clock-out/:id', attendanceController.clockOut);
router.get('/monthly-summary', attendanceController.getMonthlySummary);

export default router;
