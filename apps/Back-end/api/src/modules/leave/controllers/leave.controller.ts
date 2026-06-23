import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../services/leave.service';
import { successResponse } from '../../../core/utils/response';
import { AppError } from '../../../core/errors/AppError';
import { AuditHelper } from '../../../core/utils/audit.helper';
import { Employee } from '../../employee/models/employee.model';
import { DepartmentModel } from '../../employee/models/department.model';

const leaveService = new LeaveService();

// Roles allowed to approve / reject / review leave requests
const REVIEWER_ROLES = ['manager', 'admin', 'owner', 'hr'];
// Roles that should only ever see their own leave records
const SELF_ONLY_ROLES = ['employee', 'user'];

export class LeaveController {

  async getTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = await leaveService.getLeaveTypes();
      successResponse(res, 200, 'Leave types retrieved', types);
    } catch (error) {
      next(error);
    }
  }
  
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const userEmail = (req.user as any).email;
      
      // Get employee details from the requesting user
      const employee = await Employee.findOne({ email: userEmail });
      if (!employee && (req.user as any).role !== 'admin') {
        throw new AppError('Employee record not found', 404);
      }

      // Resolve a human-readable department name from the employee's departmentId
      let departmentName = req.body.department;
      if (employee?.departmentId) {
        const dept = await DepartmentModel.findById(employee.departmentId).select('name');
        if (dept?.name) departmentName = dept.name;
      }

      const leaveData = {
        ...req.body,
        employee_id: employee?._id || req.body.employee_id,
        full_name: employee ? `${employee.firstName} ${employee.lastName}` : req.body.full_name,
        employee_code: employee?.employeeId || req.body.employee_code,
        department: departmentName || req.body.department || 'General',
        position: employee?.position || req.body.position || 'Employee'
      };

      const leave = await leaveService.create(leaveData, userId);
      
      // LOG THIS ACTION!
      await AuditHelper.log(
        req,
        'CREATE',
        'LEAVE',
        leave._id.toString(),
        'SUCCESS',
        { 
          after: {
            leave_id: leave.leave_id,
            employee: leave.full_name,
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            total_days: leave.total_days
          }
        }
      );
      
      successResponse(res, 201, 'Leave request created successfully', {
        leave_id: leave.leave_id,
        ...leave.toObject()
      });
    } catch (error) {
      await AuditHelper.log(
        req,
        'CREATE',
        'LEAVE',
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
      const userRole = (req.user as any).role;
      const userEmail = (req.user as any).email;
      
      const filters: any = {
        status: req.query.status as any,
        leave_type: req.query.leave_type as any,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        search: req.query.search as string,
        employee_id: req.query.employee_id as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      // Self-only roles (employee/user) can only ever see their own leave requests
      if (SELF_ONLY_ROLES.includes(userRole)) {
        const employee = await Employee.findOne({ email: userEmail });
        // If no employee record, force an empty result rather than leaking all records
        filters.employee_id = employee ? employee._id.toString() : '000000000000000000000000';
      }
      
      console.log('Leave getAll filters:', filters);
      const result = await leaveService.findAll(filters);
      
      await AuditHelper.log(req, 'VIEW', 'LEAVE', undefined, 'SUCCESS');
      
      successResponse(res, 200, 'Leave requests retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const leave = await leaveService.findById(req.params.id);
      
      if (!leave) {
        throw new AppError('Leave request not found', 404);
      }
      
      await AuditHelper.log(
        req,
        'VIEW',
        'LEAVE',
        leave._id.toString(),
        'SUCCESS'
      );
      
      successResponse(res, 200, 'Leave request retrieved successfully', leave);
    } catch (error) {
      next(error);
    }
  }
  
  async getByLeaveId(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveId = parseInt(req.params.leaveId);
      const leave = await leaveService.findByLeaveId(leaveId);
      
      if (!leave) {
        throw new AppError('Leave request not found', 404);
      }
      
      successResponse(res, 200, 'Leave request retrieved successfully', leave);
    } catch (error) {
      next(error);
    }
  }
  
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const oldLeave = await leaveService.findById(req.params.id);
      
      if (!oldLeave) {
        throw new AppError('Leave request not found', 404);
      }
      
      // Only allow updates if status is pending
      if (oldLeave.status !== 'pending' && (req.user as any).role !== 'admin') {
        throw new AppError('Cannot update a leave request that is not pending', 400);
      }

      // Self-only roles cannot change approval status / reviewer fields via update
      const updateData = { ...req.body };
      if (SELF_ONLY_ROLES.includes((req.user as any).role)) {
        delete updateData.status;
        delete updateData.reviewed_by;
        delete updateData.reviewer_name;
        delete updateData.reviewed_at;
        delete updateData.rejection_reason;
      }

      const updatedLeave = await leaveService.update(req.params.id, updateData, userId);
      
      await AuditHelper.log(
        req,
        'UPDATE',
        'LEAVE',
        req.params.id,
        'SUCCESS',
        {
          before: {
            leave_id: oldLeave.leave_id,
            status: oldLeave.status,
            start_date: oldLeave.start_date,
            end_date: oldLeave.end_date
          },
          after: {
            leave_id: updatedLeave?.leave_id,
            status: updatedLeave?.status,
            start_date: updatedLeave?.start_date,
            end_date: updatedLeave?.end_date
          }
        }
      );
      
      successResponse(res, 200, 'Leave request updated successfully', updatedLeave);
    } catch (error) {
      await AuditHelper.log(
        req,
        'UPDATE',
        'LEAVE',
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
      // Only admins can delete leave requests
      if ((req.user as any).role !== 'admin') {
        throw new AppError('Only administrators can delete leave requests', 403);
      }
      
      const leave = await leaveService.findById(req.params.id);
      
      if (!leave) {
        throw new AppError('Leave request not found', 404);
      }
      
      await leaveService.delete(req.params.id);
      
      await AuditHelper.log(
        req,
        'DELETE',
        'LEAVE',
        req.params.id,
        'SUCCESS',
        { 
          before: {
            leave_id: leave.leave_id,
            employee: leave.full_name,
            status: leave.status
          }
        }
      );
      
      successResponse(res, 200, 'Leave request deleted successfully');
    } catch (error) {
      await AuditHelper.log(
        req,
        'DELETE',
        'LEAVE',
        req.params.id,
        'FAILURE',
        undefined,
        error.message
      );
      next(error);
    }
  }
  
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = (req.user as any).role;
      if (!REVIEWER_ROLES.includes(userRole)) {
        throw new AppError('You are not allowed to approve leave requests', 403);
      }

      const reviewerId = (req.user as any)._id;
      const reviewerName = (req.user as any).firstName + ' ' + (req.user as any).lastName;
      
      const leave = await leaveService.findById(req.params.id);
      
      if (!leave) {
        throw new AppError('Leave request not found', 404);
      }
      
      if (leave.status !== 'pending') {
        throw new AppError('Only pending requests can be approved', 400);
      }
      
      const approved = await leaveService.approve(req.params.id, reviewerId, reviewerName);
      
      await AuditHelper.log(
        req,
        'APPROVE',
        'LEAVE',
        req.params.id,
        'SUCCESS',
        {
          before: { status: 'pending' },
          after: { status: 'approved' }
        },
        `Leave request #${leave.leave_id} approved`
      );
      
      successResponse(res, 200, 'Leave request approved successfully', approved);
    } catch (error) {
      next(error);
    }
  }
  
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = (req.user as any).role;
      if (!REVIEWER_ROLES.includes(userRole)) {
        throw new AppError('You are not allowed to reject leave requests', 403);
      }

      const { reason } = req.body;
      
      if (!reason) {
        throw new AppError('Rejection reason is required', 400);
      }
      
      const reviewerId = (req.user as any)._id;
      const reviewerName = (req.user as any).firstName + ' ' + (req.user as any).lastName;
      
      const leave = await leaveService.findById(req.params.id);
      
      if (!leave) {
        throw new AppError('Leave request not found', 404);
      }
      
      if (leave.status !== 'pending') {
        throw new AppError('Only pending requests can be rejected', 400);
      }
      
      const rejected = await leaveService.reject(req.params.id, reviewerId, reviewerName, reason);
      
      await AuditHelper.log(
        req,
        'REJECT',
        'LEAVE',
        req.params.id,
        'SUCCESS',
        {
          before: { status: 'pending' },
          after: { status: 'rejected', reason }
        },
        `Leave request #${leave.leave_id} rejected: ${reason}`
      );
      
      successResponse(res, 200, 'Leave request rejected successfully', rejected);
    } catch (error) {
      next(error);
    }
  }
  
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      
      const leave = await leaveService.findById(req.params.id);
      
      if (!leave) {
        throw new AppError('Leave request not found', 404);
      }
      
      // Only allow cancellation if status is pending or approved
      if (leave.status !== 'pending' && leave.status !== 'approved') {
        throw new AppError('Cannot cancel this leave request', 400);
      }
      
      const cancelled = await leaveService.cancel(req.params.id, userId);
      
      await AuditHelper.log(
        req,
        'UPDATE',
        'LEAVE',
        req.params.id,
        'SUCCESS',
        {
          before: { status: leave.status },
          after: { status: 'cancelled' }
        },
        `Leave request #${leave.leave_id} cancelled`
      );
      
      successResponse(res, 200, 'Leave request cancelled successfully', cancelled);
    } catch (error) {
      next(error);
    }
  }
  
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = (req.user as any).role;
      const userEmail = (req.user as any).email;
      
      const filters: any = {};
      
      // If employee, only show their own stats
      if (userRole === 'employee') {
        const employee = await Employee.findOne({ email: userEmail });
        if (employee) {
          filters.employee_id = employee._id.toString();
        }
      }
      
      const stats = await leaveService.getStats(filters);
      
      successResponse(res, 200, 'Leave statistics retrieved', stats);
    } catch (error) {
      next(error);
    }
  }
  
  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userEmail = (req.user as any).email;
      
      let employeeId = req.params.employeeId;
      
      // No id in the path → resolve the balance for the authenticated user
      if (!employeeId) {
        const employee = await Employee.findOne({ email: userEmail });
        if (employee) {
          employeeId = employee._id.toString();
        }
      }
      
      if (!employeeId) {
        throw new AppError('Employee record not found for this user', 404);
      }
      
      const balance = await leaveService.getEmployeeLeaveBalance(employeeId);
      
      successResponse(res, 200, 'Leave balance retrieved', balance);
    } catch (error) {
      next(error);
    }
  }
}
