import express from 'express';
import {
  bulkImportEmployees,
  createEmployee,
} from '../controllers/employee.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// All routes require authentication
router.use(authenticateToken);

// Onboarding specific endpoints (matches frontend expectations)
router.post('/process-bulk', bulkImportEmployees);
router.post('/save-draft', createEmployee);
router.post('/extract-document', upload.single('document'), (req, res) => {
  res.json({ 
    success: true, 
    data: { employees: [] }, 
    message: 'Document extraction will be implemented soon. Please use form or table mode for now.' 
  });
});

export default router;
