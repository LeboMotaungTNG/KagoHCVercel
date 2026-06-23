import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../../core/middleware/auth.middleware';
import PayrollSettings from '../models/PayrollSettings';

const router = Router();

router.use(authenticateToken);

// GET /api/v1/owner/payroll/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?._id;
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    let settings = await PayrollSettings.findOne({ ownerId });

    if (!settings) {
      // Return defaults if not yet configured
      settings = await PayrollSettings.create({ ownerId });
    }

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/v1/owner/payroll/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?._id;
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      standardHoursPerDay,
      standardDaysPerMonth,
      overtimeRate,
      weekendRate,
      holidayRate,
      uifRate,
      sdlRate,
      payeEnabled,
      taxYear,
    } = req.body;

    const settings = await PayrollSettings.findOneAndUpdate(
      { ownerId },
      {
        ownerId,
        ...(standardHoursPerDay !== undefined && { standardHoursPerDay }),
        ...(standardDaysPerMonth !== undefined && { standardDaysPerMonth }),
        ...(overtimeRate !== undefined && { overtimeRate }),
        ...(weekendRate !== undefined && { weekendRate }),
        ...(holidayRate !== undefined && { holidayRate }),
        ...(uifRate !== undefined && { uifRate }),
        ...(sdlRate !== undefined && { sdlRate }),
        ...(payeEnabled !== undefined && { payeEnabled }),
        ...(taxYear !== undefined && { taxYear }),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;