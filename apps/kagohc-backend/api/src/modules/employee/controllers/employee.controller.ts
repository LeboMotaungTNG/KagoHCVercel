import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { successResponse } from '../../../core/utils/response';
import { AppError } from '../../../core/errors/AppError';
import { AuditHelper } from '../../../core/utils/audit.helper';

const employeeService = new EmployeeService();

export class EmployeeController {
  
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      
      // Check if employee with same email exists
      const existing = await employeeService.findByEmail(req.body.email);
      if (existing) {
        throw new AppError('Employee with this email already exists', 400);
      }

      const employee = await employeeService.create(req.body, userId);
      
      // LOG THIS ACTION!
      await AuditHelper.log(
        req,
        'CREATE',
        'EMPLOYEE',
        employee._id.toString(),
        'SUCCESS',
        { 
          after: {
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email,
            department: employee.department
          }
        }
      );
      
      successResponse(res, 201, 'Employee created successfully', employee);
    } catch (error) {
      await AuditHelper.log(
        req,
        'CREATE',
        'EMPLOYEE',
        undefined,
        'FAILURE',
        undefined,
        error.message
      );
      next(error);
    }
  }
  
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const mongoFilter: any = {};
      
      if (req.query.department) {
        mongoFilter.department = req.query.department;
      }
      if (req.query.userId) {
        mongoFilter.userId = req.query.userId;
      }
      if (req.query.email) {
        mongoFilter.email = req.query.email;
      }
      if (req.query.status) {
        mongoFilter.status = req.query.status;
      }
      if (req.query.search) {
        mongoFilter.$or = [
          { firstName: { $regex: req.query.search, $options: 'i' } },
          { lastName: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
          { employeeId: { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      const result = await employeeService.findAll(mongoFilter, page, limit);
      
      await AuditHelper.log(req, 'VIEW', 'EMPLOYEE', undefined, 'SUCCESS');
      
      successResponse(res, 200, 'Employees retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Find employee record by userId
      const employee = await employeeService.findByUserId(userId);
      
      if (!employee) {
        throw new AppError('Employee record not found for this user', 404);
      }
      
      await AuditHelper.log(
        req,
        'VIEW',
        'EMPLOYEE',
        employee._id.toString(),
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Employee record retrieved successfully', employee);
    } catch (error) {
      next(error);
    }
  }
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.findById(req.params.id);
      
      if (!employee) {
        throw new AppError('Employee not found', 404);
      }
      
      await AuditHelper.log(
        req,
        'VIEW',
        'EMPLOYEE',
        employee._id.toString(),
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Employee retrieved successfully', employee);
    } catch (error) {
      next(error);
    }
  }
  
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const oldEmployee = await employeeService.findById(req.params.id);
      
      if (!oldEmployee) {
        throw new AppError('Employee not found', 404);
      }
      
      const updatedEmployee = await employeeService.update(
        req.params.id,
        req.body,
        userId
      );
      
      await AuditHelper.log(
        req,
        'UPDATE',
        'EMPLOYEE',
        req.params.id,
        'SUCCESS',
        {
          before: {
            name: `${oldEmployee.firstName} ${oldEmployee.lastName}`,
            department: oldEmployee.department,
            status: oldEmployee.status
          },
          after: {
            name: `${updatedEmployee?.firstName} ${updatedEmployee?.lastName}`,
            department: updatedEmployee?.department,
            status: updatedEmployee?.status
          }
        }
      );
      
      successResponse(res, 200, 'Employee updated successfully', updatedEmployee);
    } catch (error) {
      await AuditHelper.log(
        req,
        'UPDATE',
        'EMPLOYEE',
        req.params.id,
        'FAILURE',
        undefined,
        error.message
      );
      next(error);
    }
  }
  
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.findById(req.params.id);
      
      if (!employee) {
        throw new AppError('Employee not found', 404);
      }
      
      await employeeService.delete(req.params.id);
      
      await AuditHelper.log(
        req,
        'DELETE',
        'EMPLOYEE',
        req.params.id,
        'SUCCESS',
        { 
          before: {
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email
          }
        }
      );
      
      successResponse(res, 200, 'Employee deleted successfully');
    } catch (error) {
      await AuditHelper.log(
        req,
        'DELETE',
        'EMPLOYEE',
        req.params.id,
        'FAILURE',
        undefined,
        error.message
      );
      next(error);
    }
  }
  
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { status } = req.body;
      
      const updatedEmployee = await employeeService.updateStatus(
        req.params.id,
        status,
        userId
      );
      
      successResponse(res, 200, 'Employee status updated successfully', updatedEmployee);
    } catch (error) {
      next(error);
    }
  }
}
