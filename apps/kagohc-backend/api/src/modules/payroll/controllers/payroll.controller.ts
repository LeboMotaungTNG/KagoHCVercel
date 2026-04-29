import { Request, Response, NextFunction } from 'express';
import { PayrollService } from '../services/payroll.service';
import { successResponse } from '../../../core/utils/response';
import { AppError } from '../../../core/errors/AppError';
import { AuditHelper } from '../../../core/utils/audit.helper';

const payrollService = new PayrollService();

const DEFAULT_SETTINGS = {
  uif_employee_rate: 1, uif_employer_rate: 1, sdl_rate: 1, sdl_minimum_threshold: 0,
  overtime_normal_rate: 1.5, overtime_weekend_rate: 2.0, overtime_holiday_rate: 2.5,
  medical_aid_percentage: 10, pension_percentage: 15, annual_bonus_percentage: 8.33, annual_leave_days: 21
};

export class PayrollController {
  
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try { successResponse(res, 200, 'Payroll settings retrieved', DEFAULT_SETTINGS); }
    catch (error) { next(error); }
  }
  
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = req.body;
      await AuditHelper.log(req, 'UPDATE', 'SYSTEM', undefined, 'SUCCESS', { after: settings }, 'Payroll settings updated');
      successResponse(res, 200, 'Payroll settings updated', settings);
    } catch (error) {
      await AuditHelper.log(req, 'UPDATE', 'SYSTEM', undefined, 'FAILURE', undefined, (error as Error).message);
      next(error);
    }
  }
  
  async generatePayrollRun(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { period_name, period_type, start_date, end_date, payment_date, employee_ids, settings = DEFAULT_SETTINGS } = req.body;
      const payroll = await payrollService.generatePayrollRun(
        period_name, period_type, new Date(start_date), new Date(end_date), new Date(payment_date),
        employee_ids, { ...DEFAULT_SETTINGS, ...settings }, userId
      );
      await AuditHelper.log(req, 'CREATE', 'SYSTEM', payroll._id.toString(), 'SUCCESS', { after: { payroll_id: payroll.payroll_id, period_name, employees: payroll.employees.length } });
      successResponse(res, 201, 'Payroll run generated', payroll);
    } catch (error) {
      await AuditHelper.log(req, 'CREATE', 'SYSTEM', undefined, 'FAILURE', undefined, (error as Error).message);
      next(error);
    }
  }
  
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = { status: req.query.status as string, page: req.query.page ? parseInt(req.query.page as string) : 1, limit: req.query.limit ? parseInt(req.query.limit as string) : 20 };
      const result = await payrollService.findAll(filters);
      successResponse(res, 200, 'Payroll runs retrieved', result);
    } catch (error) { next(error); }
  }
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payroll = await payrollService.findById(req.params.id);
      if (!payroll) throw new AppError('Payroll run not found', 404);
      successResponse(res, 200, 'Payroll run retrieved', payroll);
    } catch (error) { next(error); }
  }
  
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { status } = req.body;
      const oldPayroll = await payrollService.findById(req.params.id);
      if (!oldPayroll) throw new AppError('Payroll run not found', 404);
      const updated = await payrollService.updateStatus(req.params.id, status, userId);
      await AuditHelper.log(req, 'UPDATE', 'SYSTEM', req.params.id, 'SUCCESS', { before: { status: oldPayroll.status }, after: { status } });
      successResponse(res, 200, 'Payroll status updated', updated);
    } catch (error) { next(error); }
  }
  
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const summary = await payrollService.getSummary(year, month);
      successResponse(res, 200, 'Payroll summary retrieved', summary);
    } catch (error) { next(error); }
  }
  
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if ((req.user as any).role !== 'admin') throw new AppError('Only administrators can delete payroll runs', 403);
      const payroll = await payrollService.findById(req.params.id);
      if (!payroll) throw new AppError('Payroll run not found', 404);
      await payrollService.delete(req.params.id);
      await AuditHelper.log(req, 'DELETE', 'SYSTEM', req.params.id, 'SUCCESS', { before: { payroll_id: payroll.payroll_id, period_name: payroll.period_name } });
      successResponse(res, 200, 'Payroll run deleted');
    } catch (error) { next(error); }
  }
  
  async getPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const payroll = await payrollService.findById(req.params.payrollId);
      if (!payroll) throw new AppError('Payroll run not found', 404);
      const employee = payroll.employees.find(e => e.employee_id.toString() === req.params.employeeId);
      if (!employee) throw new AppError('Employee not found in this payroll run', 404);
      successResponse(res, 200, 'Payslip retrieved', { payroll, employee });
    } catch (error) { next(error); }
  }
}
