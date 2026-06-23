import { Request, Response } from 'express';
import { User } from '../../auth/user.model';

export const ownerController = {
  // Create a new owner
  createOwner: async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;
      
      console.log('Creating owner:', { firstName, lastName, email });
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }
      
      // Create new owner (password will be hashed by pre-save middleware)
      const newOwner = new User({
        firstName,
        lastName,
        email,
        phone: phone || '',
        password,
        role: 'owner',
        isActive: true
      });
      
      await newOwner.save();
      
      // Return owner without password
      const ownerResponse = {
        _id: newOwner._id,
        firstName: newOwner.firstName,
        lastName: newOwner.lastName,
        email: newOwner.email,
        phone: (newOwner as any).phone || '',
        role: newOwner.role,
        isActive: newOwner.isActive
      };
      
      console.log('Owner created successfully:', ownerResponse.email);
      
      res.status(201).json({ 
        success: true, 
        data: ownerResponse,
        message: 'Owner created successfully'
      });
    } catch (error: any) {
      console.error('Create owner error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },
  
  // Get all owners
  getAllOwners: async (req: Request, res: Response) => {
    try {
      const owners = await User.find({ role: 'owner' }).select('-password');
      res.json({ success: true, data: owners });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Get company settings
  getCompanySettings: async (req: Request, res: Response) => {
    try {
      res.json({ success: true, data: {} });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Update company settings
  updateCompanySettings: async (req: Request, res: Response) => {
    try {
      res.json({ success: true, message: 'Company settings updated' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Complete onboarding
  completeOnboarding: async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user?._id;
      await User.findByIdAndUpdate(ownerId, { onboardingCompleted: true });
      res.json({ success: true, message: 'Onboarding completed' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Upload company logo
  uploadCompanyLogo: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const ownerId = (req as any).user?._id;
      const logoPath = `uploads/${req.file.filename}`;

      // Update owner/company settings with logo path
      await User.findByIdAndUpdate(
        ownerId,
        { companyLogo: logoPath },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logoPath,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
