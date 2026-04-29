const expressValidator = require('express-validator');
const { body, param, query } = expressValidator;

export const createCaseValidator = [
  body('employeeId').isMongoId().withMessage('Valid employee ID required'),
  body('reportedBy').isMongoId().withMessage('Valid reporter ID required'),
  body('incidentDate').isISO8601().withMessage('Valid incident date required'),
  body('category').isIn(['misconduct', 'performance', 'attendance', 'harassment', 'discrimination', 'safety_violation', 'fraud', 'confidentiality_breach', 'theft', 'insubordination', 'negligence', 'substance_abuse', 'other']),
  body('severity').isIn(['minor', 'moderate', 'serious', 'gross']),
  body('description').notEmpty().isLength({ min: 10, max: 5000 })
];

export const scheduleHearingValidator = [
  body('caseId').isMongoId(),
  body('hearingDate').isISO8601(),
  body('hearingTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('venue').notEmpty(),
  body('chairperson').isMongoId()
];

export const createSanctionValidator = [
  body('caseId').isMongoId(),
  body('hearingId').isMongoId(),
  body('type').isIn(['verbal_warning', 'written_warning', 'final_written_warning', 'suspension', 'demotion', 'pay_cut', 'transfer', 'termination', 'training', 'counseling', 'probation_extension']),
  body('severity').isIn(['low', 'medium', 'high', 'critical']),
  body('description').notEmpty(),
  body('effectiveDate').isISO8601()
];

export const createAppealValidator = [
  body('caseId').isMongoId(),
  body('sanctionId').isMongoId(),
  body('grounds').isArray().notEmpty(),
  body('reason').notEmpty().isLength({ min: 20, max: 5000 })
];

export const idParamValidator = [
  param('id').isMongoId().withMessage('Valid ID required')
];

export const reportFiltersValidator = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('category').optional().isString(),
  query('severity').optional().isString(),
  query('status').optional().isString(),
  query('department').optional().isString()
];
