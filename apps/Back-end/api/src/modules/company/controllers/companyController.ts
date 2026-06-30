import { Request, Response } from 'express';
import Company from '../models/Company';

export const getCompanySettings = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    
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
    const ownerId = (req as any).user?.id;
    const updateData = req.body;
    
    const company = await Company.findOneAndUpdate(
      { ownerId },
      { ...updateData, updatedAt: new Date() },
      { new: true, upsert: true }
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
    const ownerId = (req as any).user?.id;
    const { country } = req.body;
    
    const company = await Company.findOneAndUpdate(
      { ownerId },
      { 
        onboardingCompleted: true, 
        onboardingCompletedAt: new Date(), 
        country,
        verified: true 
      },
      { new: true }
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