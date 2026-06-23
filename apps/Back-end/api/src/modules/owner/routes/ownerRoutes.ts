import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ownerController } from '../controllers/ownerController';
import companyRoutes from '../../company/routes/companyRoutes';
import Company from '../../company/models/Company';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = express.Router();

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../../uploads/logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ownerId = (req as any).user?.id;
    const ext = path.extname(file.originalname);
    cb(null, `logo_${ownerId}_${Date.now()}${ext}`);
  }
});

const logoUpload = multer({ 
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
    }
  }
});

// Public routes (no authentication required for creation)
router.post('/create', ownerController.createOwner);

// Protected routes (require authentication)
router.get('/', authenticateToken, ownerController.getAllOwners);

// Logo upload endpoint
router.post('/company/logo', authenticateToken, logoUpload.single('logo'), async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    // Update company with logo URL
    const company = await Company.findOneAndUpdate(
      { ownerId },
      { logoUrl, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    
    res.json({ 
      success: true, 
      data: { logoUrl },
      message: 'Logo uploaded successfully' 
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
});

// Onboarding complete endpoint
router.post('/onboarding/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const { country, company } = req.body;
    
    // Update company with onboarding completion
    const updatedCompany = await Company.findOneAndUpdate(
      { ownerId },
      { 
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        country: country,
        ...(company && company)
      },
      { new: true, upsert: true }
    );
    
    res.json({ 
      success: true,
      data: updatedCompany,
      message: 'Onboarding completed successfully' 
    });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete onboarding' });
  }
});

// Company module routes
router.use('/company', companyRoutes);

export default router;
