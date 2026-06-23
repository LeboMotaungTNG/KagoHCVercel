import { Request, Response } from 'express';
import Company from '../models/Company';

const getOwnerId = (req: Request): string | undefined => {
  const u = (req as any).user;
  return u?._id || u?.id || u?.userId;
};

export const getCompanySettings = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let company = await Company.findOne({ ownerId });

    if (!company) {
      company = await Company.create({ ownerId });
    }

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateCompanySettings = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const updateData = req.body;

    const company = await Company.findOneAndUpdate(
      { ownerId },
      { ...updateData, ownerId, updatedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: company,
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { country } = req.body;
    
    const company = await Company.findOneAndUpdate(
      { ownerId },
      {
        ownerId,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        country,
        verified: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json({
      success: true,
      data: company,
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
