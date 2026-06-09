import { Router } from 'express';
import { kpiController } from '../controllers/kpi.controller';
import { authenticate } from '../../auth/auth.middleware';
import { authorize } from '../../auth/auth.middleware';

const router = Router();

// All KPI routes require authentication
router.use(authenticate);

// Template routes
router.post('/templates', authorize('admin', 'manager'), kpiController.createTemplate);
router.get('/templates', kpiController.getTemplates);
router.get('/templates/:id', kpiController.getTemplateById);
router.put('/templates/:id', authorize('admin', 'manager'), kpiController.updateTemplate);

// Period management (admin/HR only)
router.post('/periods', authorize('admin', 'hr'), kpiController.createPeriod);
router.get('/periods', kpiController.getPeriods);
router.get('/periods/current', kpiController.getCurrentPeriod);
router.get('/periods/:id', kpiController.getPeriodById);
router.put('/periods/:id', authorize('admin', 'hr'), kpiController.updatePeriod);
router.post('/periods/:id/lock', authorize('admin', 'hr'), kpiController.lockPeriod);
router.get('/periods/:id/status', kpiController.checkPeriodStatus);

// Assessment routes
router.post('/assessments', authorize('admin', 'manager'), kpiController.createAssessment);
router.get('/assessments/my', kpiController.getMyAssessments);
router.get('/assessments/pending', authorize('admin', 'manager'), kpiController.getPendingAssessments);
router.get('/assessments/employee/:employeeId', authorize('admin', 'manager'), kpiController.getEmployeeAssessments);
router.post('/assessments/:id/submit', kpiController.submitAssessment);
router.post('/assessments/:id/review', authorize('admin', 'manager'), kpiController.reviewAssessment);
router.post('/assessments/:id/approve', authorize('admin'), kpiController.approveAssessment);

// Analytics routes
router.get('/history/:employeeId?', kpiController.getKpiHistory);
router.get('/stats/department', authorize('admin', 'manager'), kpiController.getDepartmentStats);

// Period processing (admin only)
router.post('/periods/process-locks', authorize('admin'), kpiController.processPeriodLocks);

// Auto-update (admin only - can be called by cron)
router.post('/periods/update-status', authorize('admin'), kpiController.updatePeriodStatuses);
export default router;