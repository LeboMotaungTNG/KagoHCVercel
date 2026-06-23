import { Request, Response } from 'express';
import TaxRate from '../TaxRate';

// @desc    Get tax rates
// @route   GET /api/v1/owner/tax-rates
export const getTaxRates = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?._id;
    let taxRates = await TaxRate.findOne({ ownerId });
    
    if (!taxRates) {
      // Return default SARS 2025/2026 brackets
      taxRates = {
        ownerId,
        taxYear: 2026,
        payeBrackets: [
          { min: 0, max: 237100, rate: 0.18 },
          { min: 237101, max: 370500, rate: 0.26 },
          { min: 370501, max: 512800, rate: 0.31 },
          { min: 512801, max: 673000, rate: 0.36 },
          { min: 673001, max: 857900, rate: 0.39 },
          { min: 857901, max: 1817000, rate: 0.41 },
          { min: 1817001, max: null, rate: 0.45 }
        ],
        primaryRebate: 17235,
        uifRate: 1.0,
        uifMaxMonthly: 177.12,
        sdlRate: 1.0,
        skillsLevyRate: 1.0
      } as any;
    }
    
    res.json({ success: true, data: taxRates });
  } catch (error) {
    console.error('Get tax rates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update tax rates
// @route   PUT /api/v1/owner/tax-rates
export const updateTaxRates = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?._id;
    const taxRates = await TaxRate.findOneAndUpdate(
      { ownerId },
      { ...req.body, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: taxRates, message: 'Tax rates updated' });
  } catch (error) {
    console.error('Update tax rates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
