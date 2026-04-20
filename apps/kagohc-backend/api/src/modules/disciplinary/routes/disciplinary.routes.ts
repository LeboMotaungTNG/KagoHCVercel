import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import { roleMiddleware } from '../../../core/middleware/role.middleware';
import { DisciplinaryCaseController } from '../controllers/disciplinaryCase.controller';
import { DisciplinaryHearingController } from '../controllers/disciplinaryHearing.controller';
import { DisciplinarySanctionController } from '../controllers/disciplinarySanction.controller';
import { DisciplinaryAppealController } from '../controllers/disciplinaryAppeal.controller';
import { DisciplinaryIncidentController } from '../controllers/disciplinaryIncident.controller';
import { DisciplinaryReportController } from '../controllers/disciplinaryReport.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Cases
router.post('/cases', 
  roleMiddleware(['admin', 'hr']),
  DisciplinaryCaseController.createCase
);

router.get('/cases',
  roleMiddleware(['admin', 'hr', 'manager']),
  DisciplinaryCaseController.getCases
);

router.get('/cases/:id',
  roleMiddleware(['admin', 'hr', 'manager']),
  DisciplinaryCaseController.getCaseById
);

router.put('/cases/:id',
  roleMiddleware(['admin', 'hr']),
  DisciplinaryCaseController.updateCase
);

router.get('/employees/:employeeId/history',
  roleMiddleware(['admin', 'hr', 'manager']),
  DisciplinaryCaseController.getEmployeeHistory
);

// Hearings
router.post('/hearings',
  roleMiddleware(['admin', 'hr']),
  DisciplinaryHearingController.scheduleHearing
);

router.put('/hearings/:id',
  roleMiddleware(['admin', 'hr']),
  DisciplinaryHearingController.updateHearing
);

// Sanctions
router.post('/sanctions',
  roleMiddleware(['admin', 'hr']),
  DisciplinarySanctionController.createSanction
);

router.put('/sanctions/:id',
  roleMiddleware(['admin', 'hr']),
  DisciplinarySanctionController.updateSanction
);

router.get('/sanctions/:id',
  roleMiddleware(['admin', 'hr', 'manager']),
  DisciplinarySanctionController.getSanction
);

// Appeals
router.post('/appeals',
  roleMiddleware(['admin', 'hr', 'employee']),
  DisciplinaryAppealController.createAppeal
);

router.put('/appeals/:id/resolve',
  roleMiddleware(['admin', 'hr']),
  DisciplinaryAppealController.resolveAppeal
);

router.get('/appeals/:id',
  roleMiddleware(['admin', 'hr', 'manager']),
  DisciplinaryAppealController.getAppeal
);

// Incidents
router.post('/incidents',
  roleMiddleware(['admin', 'hr', 'manager']),
  DisciplinaryIncidentController.reportIncident
);

router.get('/incidents',
  roleMiddleware(['admin', 'hr', 'manager']),
  DisciplinaryIncidentController.getIncidents
);

// Reports
router.get('/reports/summary',
  roleMiddleware(['admin', 'hr']),
  DisciplinaryReportController.getSummaryReport
);

router.get('/reports/trends',
  roleMiddleware(['admin', 'hr']),
  DisciplinaryReportController.getTrendAnalysis
);

export default router;
