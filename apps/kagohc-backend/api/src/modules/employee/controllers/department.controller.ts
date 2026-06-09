import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';
import { successResponse } from '../../../core/utils/response';
import { AppError } from '../../../core/errors/AppError';
import { AuditHelper } from '../../../core/utils/audit.helper';

const departmentService = new DepartmentService();

export class DepartmentController {
  
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      console.log('Creating department with userId:', userId);
      
      // Add the user IDs from the authenticated user
      const departmentData = {
        ...req.body,
        createdBy: userId,
        updatedBy: userId
      };
      
      console.log('Department data:', departmentData);
      
      const department = await departmentService.create(departmentData, userId);
      
      // LOG THIS ACTION!
      await AuditHelper.log(
        req,
        'CREATE',
        'DEPARTMENT',
        department._id.toString(),
        'SUCCESS',
        { after: department }
      );
      
      successResponse(res, 201, 'Department created successfully', department);
    } catch (error) {
      console.error('Department creation error:', error);
      // Log failure
      await AuditHelper.log(
        req,
        'CREATE',
        'DEPARTMENT',
        undefined,
        'FAILURE',
        undefined,
        error instanceof Error ? error.message : String(error)
      ).catch(e => console.error('Audit log failed:', e));
      next(error);
    }
  }
  
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await departmentService.findAll(req.query);
      
      // LOG VIEW (optional - can be noisy)
      await AuditHelper.log(
        req,
        'VIEW',
        'DEPARTMENT',
        undefined,
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Departments retrieved', departments);
    } catch (error) {
      next(error);
    }
  }
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.findById(req.params.id);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
      
      // LOG VIEW of specific department
      await AuditHelper.log(
        req,
        'VIEW',
        'DEPARTMENT',
        department._id.toString(),
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Department retrieved', department);
    } catch (error) {
      next(error);
    }
  }
  
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const oldDepartment = await departmentService.findById(req.params.id);
      
      if (!oldDepartment) {
        throw new AppError('Department not found', 404);
      }
      
      const updatedDepartment = await departmentService.update(
        req.params.id,
        req.body,
        userId
      );
      
      // LOG UPDATE with before/after!
      await AuditHelper.log(
        req,
        'UPDATE',
        'DEPARTMENT',
        req.params.id,
        'SUCCESS',
        {
          before: oldDepartment,
          after: updatedDepartment
        }
      );
      
      successResponse(res, 200, 'Department updated', updatedDepartment);
    } catch (error) {
      // Log failure
      await AuditHelper.log(
        req,
        'UPDATE',
        'DEPARTMENT',
        req.params.id,
        'FAILURE',
        undefined,
        error instanceof Error ? error.message : String(error)
      );
      next(error);
    }
  }
  
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.findById(req.params.id);
      
      if (!department) {
        throw new AppError('Department not found', 404);
      }
      
      await departmentService.delete(req.params.id);
      
      // LOG DELETE!
      await AuditHelper.log(
        req,
        'DELETE',
        'DEPARTMENT',
        req.params.id,
        'SUCCESS',
        { before: department }
      );
      
      successResponse(res, 200, 'Department deleted successfully');
    } catch (error) {
      // Log failure
      await AuditHelper.log(
        req,
        'DELETE',
        'DEPARTMENT',
        req.params.id,
        'FAILURE',
        undefined,
        error instanceof Error ? error.message : String(error)
      );
      next(error);
    }
  }
  
  async getHierarchy(req: Request, res: Response, next: NextFunction) {
    try {
      const hierarchy = await departmentService.getHierarchy();
      
      successResponse(res, 200, 'Department hierarchy retrieved', hierarchy);
    } catch (error) {
      next(error);
    }
  }
}
