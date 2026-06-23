import { Request, Response } from 'express';
import AttendanceService from '../services/attendance.service';
import { successResponse } from '../../../core/utils/response';

const normalizeAttendanceRecord = (record: any) => {
  // Convert Mongoose document to plain object if needed
  const data = record.toObject ? record.toObject() : record;
  
  return {
    attendance_id: data.attendance_id ?? data._id?.toString?.() ?? data.id,
    employee_id: typeof data.employee_id === 'object' && data.employee_id?._id 
      ? data.employee_id._id.toString() 
      : (data.employee_id?.toString?.() || data.employee_id || data.employeeId),
    employee_code: data.employee_code ?? data.employeeId,
    employee_name: data.employee_name ?? data.employeeName,
    department: data.department,
    position: data.position,
    clock_in: data.clock_in ?? data.clockIn,
    clock_out: data.clock_out ?? data.clockOut,
    hours_worked: data.hours_worked ?? data.hoursWorked,
    overtime_hours: data.overtime_hours ?? data.overtimeHours,
    date: data.date,
    status: data.status,
  };
};

export const attendanceController = {
  // Get all attendance records
  getAllAttendance: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const role = req.user?.role;
      
      console.log('getAllAttendance called:', { userId, role });
      
      let records;
      if (role === 'admin' || role === 'manager' || role === 'hr') {
        console.log('Fetching all attendance records (admin/manager/hr)');
        records = await AttendanceService.getAllAttendance();
      } else {
        console.log('Fetching attendance records for user:', userId);
        records = await AttendanceService.getAttendanceForUser(userId);
      }
      
      console.log(`Retrieved ${records.length} attendance records`);
      
      const normalized = records.map(normalizeAttendanceRecord);
      successResponse(res, 200, 'Attendance records retrieved successfully', { data: normalized });
    } catch (error) {
      console.error('Error in getAllAttendance:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  },

  // Get today's attendance
  getTodayAttendance: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      console.log('getTodayAttendance called for userId:', userId);
      const status = await AttendanceService.getTodayStatusForUser(userId);
      res.json({ success: true, data: status });
    } catch (error) {
      console.error('Error in getTodayAttendance:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

// Clock in
  clockIn: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      console.log('clockIn - Full req.user:', JSON.stringify(req.user));
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required. Please log in again.',
          error: 'User ID is missing from token' 
        });
      }
      
      const { notes, date } = req.body;
      console.log('clockIn controller called for userId:', userId, 'with date:', date);
      
      const record = await AttendanceService.clockIn(userId, notes, date);
      console.log('Clock in successful, returning record:', record._id);
      successResponse(res, 200, 'Clocked in successfully', normalizeAttendanceRecord(record));
    } catch (error) {
      console.error('Error in clockIn controller:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Return specific error messages for known issues
      if (message.includes('not found for user') || message.includes('Employee not found')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee profile not found. Please contact HR to set up your employee account.',
          error: message
        });
      }
      
      if (message.includes('Already clocked in')) {
        return res.status(400).json({ 
          success: false, 
          message: message,
          error: message
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: message,
        error: message
      });
    }
  },

  // Clock out
  clockOut: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      console.log('clockOut called for id:', id);
      const record = await AttendanceService.clockOut(id, notes);
      successResponse(res, 200, 'Clocked out successfully', normalizeAttendanceRecord(record));
    } catch (error) {
      console.error('Error in clockOut:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        success: false, 
        message: message,
        error: message
      });
    }
  },

  // Clock out for authenticated user
  clockOutToday: async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User ID is missing' });
      }
      const { notes } = req.body;
      console.log('clockOutToday called for userId:', userId);
      const record = await AttendanceService.clockOut(userId, notes);
      console.log('Clock out successful');
      successResponse(res, 200, 'Clocked out successfully', normalizeAttendanceRecord(record));
    } catch (error) {
      console.error('Error in clockOutToday:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        success: false, 
        message: message,
        error: message
      });
    }
  },

  // Get monthly summary
  getMonthlySummary: async (req: Request, res: Response) => {
    try {
      const { employeeId, month, year } = req.query;
      
      if (!employeeId || !month || !year) {
        return res.status(400).json({ 
          success: false, 
          error: 'employeeId, month, and year are required' 
        });
      }

      console.log('getMonthlySummary called:', { employeeId, month, year });
      const summary = await AttendanceService.getMonthlySummary(
        employeeId as string,
        parseInt(month as string),
        parseInt(year as string)
      );
      successResponse(res, 200, 'Monthly summary retrieved successfully', summary);
    } catch (error) {
      console.error('Error in getMonthlySummary:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
};
