import { Request, Response, NextFunction } from 'express';
import { LeaveRulesService } from '../services/leave-rules.service';
import { successResponse } from '../../../core/utils/response';
import { AppError } from '../../../core/errors/AppError';
import { AuditHelper } from '../../../core/utils/audit.helper';

const leaveRulesService = new LeaveRulesService();

export class LeaveRulesController {
  
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const isActive = req.query.is_active !== undefined 
        ? req.query.is_active === 'true' 
        : undefined;
      const search = req.query.search as string | undefined;
      
      const rules = await leaveRulesService.getAll({ 
        is_active: isActive,
        search 
      });
      
      await AuditHelper.log(req, 'VIEW', 'LEAVE_RULES', undefined, 'SUCCESS');
      successResponse(res, 200, 'Leave rules retrieved successfully', rules);
    } catch (error) {
      next(error);
    }
  }
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await leaveRulesService.findById(req.params.id);
      
      if (!rule) {
        throw new AppError('Leave rule not found', 404);
      }
      
      await AuditHelper.log(
        req, 
        'VIEW', 
        'LEAVE_RULES', 
        rule._id.toString(), 
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Leave rule retrieved successfully', rule);
    } catch (error) {
      next(error);
    }
  }
  
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const rule = await leaveRulesService.create(req.body, userId);
      
      await AuditHelper.log(
        req, 
        'CREATE', 
        'LEAVE_RULES', 
        rule._id.toString(), 
        'SUCCESS',
        { after: { name: rule.name } }
      );
      
      successResponse(res, 201, 'Leave rule created successfully', rule);
    } catch (error) {
      await AuditHelper.log(
        req, 
        'CREATE', 
        'LEAVE_RULES', 
        undefined, 
        'FAILURE',
        undefined,
        (error as Error).message
      );
      next(error);
    }
  }
  
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const oldRule = await leaveRulesService.findById(req.params.id);
      
      if (!oldRule) {
        throw new AppError('Leave rule not found', 404);
      }
      
      const updatedRule = await leaveRulesService.update(req.params.id, req.body, userId);
      
      await AuditHelper.log(
        req, 
        'UPDATE', 
        'LEAVE_RULES', 
        req.params.id, 
        'SUCCESS',
        {
          before: { name: oldRule.name },
          after: { name: updatedRule.name }
        }
      );
      
      successResponse(res, 200, 'Leave rule updated successfully', updatedRule);
    } catch (error) {
      await AuditHelper.log(
        req, 
        'UPDATE', 
        'LEAVE_RULES', 
        req.params.id, 
        'FAILURE',
        undefined,
        (error as Error).message
      );
      next(error);
    }
  }
  
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await leaveRulesService.findById(req.params.id);
      
      if (!rule) {
        throw new AppError('Leave rule not found', 404);
      }
      
      await leaveRulesService.delete(req.params.id);
      
      await AuditHelper.log(
        req, 
        'DELETE', 
        'LEAVE_RULES', 
        req.params.id, 
        'SUCCESS',
        { before: { name: rule.name } }
      );
      
      successResponse(res, 200, 'Leave rule deleted successfully');
    } catch (error) {
      await AuditHelper.log(
        req, 
        'DELETE', 
        'LEAVE_RULES', 
        req.params.id, 
        'FAILURE',
        undefined,
        (error as Error).message
      );
      next(error);
    }
  }
  
  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const rule = await leaveRulesService.toggleActive(req.params.id, userId);
      
      await AuditHelper.log(
        req, 
        'UPDATE', 
        'LEAVE_RULES', 
        req.params.id, 
        'SUCCESS',
        { after: { is_active: rule.is_active } }
      );
      
      successResponse(res, 200, `Leave rule ${rule.is_active ? 'activated' : 'deactivated'} successfully`, rule);
    } catch (error) {
      next(error);
    }
  }
  
  // Cycle endpoints
  async addCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const rule = await leaveRulesService.addCycle(req.params.id, req.body, userId);
      
      await AuditHelper.log(
        req, 
        'CREATE', 
        'LEAVE_CYCLE', 
        req.params.id, 
        'SUCCESS'
      );
      
      successResponse(res, 201, 'Leave cycle added successfully', rule);
    } catch (error) {
      next(error);
    }
  }
  
  async updateCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { cycleId } = req.params;
      
      const rule = await leaveRulesService.updateCycle(req.params.id, cycleId, req.body, userId);
      
      await AuditHelper.log(
        req, 
        'UPDATE', 
        'LEAVE_CYCLE', 
        `${req.params.id}/${cycleId}`, 
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Leave cycle updated successfully', rule);
    } catch (error) {
      next(error);
    }
  }
  
  async deleteCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { cycleId } = req.params;
      
      const rule = await leaveRulesService.deleteCycle(req.params.id, cycleId, userId);
      
      await AuditHelper.log(
        req, 
        'DELETE', 
        'LEAVE_CYCLE', 
        `${req.params.id}/${cycleId}`, 
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Leave cycle deleted successfully', rule);
    } catch (error) {
      next(error);
    }
  }
  
  async seedDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      
      await leaveRulesService.seedDefaultRules(userId);
      
      await AuditHelper.log(
        req, 
        'CREATE', 
        'LEAVE_RULES', 
        undefined, 
        'SUCCESS',
        { after: { action: 'seed_default_rules' } }
      );
      
      successResponse(res, 200, 'Default leave rules seeded successfully');
    } catch (error) {
      next(error);
    }
  }
}
