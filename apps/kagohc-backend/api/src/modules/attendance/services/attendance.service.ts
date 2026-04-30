import { Employee, IEmployee } from '../../employee/models/employee.model';
import { Attendance, IAttendance } from '../models/attendance.model';
import mongoose from 'mongoose';

// Helper function to find employee by email
async function findEmployeeByEmail(email: string): Promise<IEmployee | null> {
  try {
    const employee = await Employee.findOne({ email }).exec();
    return employee;
  } catch (error) {
    console.error('Error finding employee by email:', error);
    return null;
  }
}

// Helper function to find employee by userId
async function findEmployeeByUserId(userId: string): Promise<IEmployee | null> {
  try {
    console.log('Finding employee for userId:', userId);
    
    if (!userId) {
      console.error('findEmployeeByUserId: userId is null or empty');
      return null;
    }
    
    let employee: IEmployee | null = null;
    
    // Convert string userId to ObjectId for proper query
    try {
      const objectIdUserId = new mongoose.Types.ObjectId(userId);
      
      // Try to find by userId as ObjectId first
      employee = await Employee.findOne({ userId: objectIdUserId }).exec();
      
      if (!employee) {
        // Try to find by userId as string (in case it was stored differently)
        employee = await Employee.findOne({ userId: userId }).exec();
      }
      
      if (!employee) {
        // Try with _id (in case of any other mapping issue)
        employee = await Employee.findOne({ _id: objectIdUserId }).exec();
      }
    } catch (e) {
      // If ObjectId conversion fails, just try direct string query
      console.log('ObjectId conversion failed, trying string query');
      employee = await Employee.findOne({ userId: userId }).exec();
    }
    
    if (employee) {
      console.log('Employee lookup result:', { 
        id: employee._id, 
        userId: employee.userId,
        name: employee.firstName + ' ' + employee.lastName,
        employeeId: employee.employeeId 
      });
    } else {
      console.log('Employee lookup result: not found for userId:', userId);
    }
    
    return employee;
  } catch (error) {
    console.error('Error finding employee by userId:', error);
    return null;
  }
}

export class AttendanceService {
  async clockIn(userId: string, notes?: string, dateStr?: string): Promise<IAttendance> {
    try {
      console.log('clockIn called with userId:', userId, 'dateStr:', dateStr);
      
      const employee = await findEmployeeByUserId(userId);
      if (!employee) {
        console.error('Employee not found for userId:', userId);
        throw new Error(`Employee not found for user: ${userId}`);
      }
      
console.log('Found employee:', { 
        _id: employee._id, 
        employeeId: employee.employeeId,
        userId: employee.userId,
        name: employee.firstName + ' ' + employee.lastName
      });
      
      // Validate employee._id is a valid ObjectId
      if (!employee._id) {
        throw new Error('Invalid employee record: _id is undefined');
      }
      
      const employeeObjectId = new mongoose.Types.ObjectId(employee._id);
      console.log('Employee ObjectId:', employeeObjectId.toString());
      
      // Parse the date from request or use today
      let today: Date;
      if (dateStr) {
        // Handle YYYY-MM-DD format from frontend
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
          throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
        }
        today = new Date(parsed);
        today.setHours(0, 0, 0, 0);
      } else {
        today = new Date();
        today.setHours(0, 0, 0, 0);
      }
      
      // Check if already clocked in today
      const existingAttendance = await Attendance.findOne({
        employee_id: employeeObjectId,
        date: today
      }).exec();
      
      if (existingAttendance && existingAttendance.clock_in) {
        throw new Error('Already clocked in today');
      }
      
      console.log('Creating attendance record for employee:', employee._id, 'on date:', today);
      
      const attendance = new Attendance({
        employee_id: employeeObjectId,
        employee_name: `${employee.firstName} ${employee.lastName}`,
        employee_code: employee.employeeId,
        department: employee.position || 'General',
        date: today,
        clock_in: new Date(),
        notes: notes,
        status: 'present',
        createdBy: new mongoose.Types.ObjectId(userId),
        updatedBy: new mongoose.Types.ObjectId(userId)
      });
      
      const saved = await attendance.save();
      console.log('Attendance record saved:', saved._id);
      return saved;
    } catch (error) {
      console.error('Error in clockIn:', error);
      throw error;
    }
  }
  
  async clockOut(userId: string, notes?: string): Promise<IAttendance> {
    try {
      console.log('clockOut called with userId:', userId);
      
      const employee = await findEmployeeByUserId(userId);
      if (!employee) {
        console.error('Employee not found for userId:', userId);
        throw new Error(`Employee not found for user: ${userId}`);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendance = await Attendance.findOne({
        employee_id: employee._id,
        date: today
      }).exec();
      
      if (!attendance) {
        throw new Error('No clock-in found for today');
      }
      
      if (attendance.clock_out) {
        throw new Error('Already clocked out today');
      }
      
      attendance.clock_out = new Date();
      attendance.notes = notes;
      
      // Calculate hours worked
      if (attendance.clock_in) {
        const hours = (attendance.clock_out.getTime() - attendance.clock_in.getTime()) / (1000 * 60 * 60);
        attendance.hours_worked = Math.round(hours * 100) / 100;
      }
      
      const saved = await attendance.save();
      console.log('Clock out successful for attendance:', saved._id);
      return saved;
    } catch (error) {
      console.error('Error in clockOut:', error);
      throw error;
    }
  }
  
  async getAttendanceForUser(userId: string, startDate?: Date, endDate?: Date): Promise<IAttendance[]> {
    const employee = await findEmployeeByUserId(userId);
    if (!employee) {
      return [];
    }
    
    let query: any = { employee_id: employee._id };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    return await Attendance.find(query).sort({ date: -1 }).exec();
  }
  
  async getTodayStatusForUser(userId: string): Promise<IAttendance | null> {
    const employee = await findEmployeeByUserId(userId);
    if (!employee) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await Attendance.findOne({
      employee_id: employee._id,
      date: today
    }).exec();
  }
  
  async getAllAttendance(filter: any = {}): Promise<IAttendance[]> {
    return await Attendance.find(filter).sort({ date: -1 }).exec();
  }

  async getMonthlySummary(employeeId: string, month: number, year: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await Attendance.find({
      employee_id: new mongoose.Types.ObjectId(employeeId),
      date: { $gte: startDate, $lte: endDate }
    }).exec();

    const summary = {
      month,
      year,
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      leave: records.filter(r => r.status === 'on-leave').length,
      totalHours: records.reduce((sum, r) => sum + (r.hours_worked || 0), 0),
      records: records.map(r => ({
        date: r.date,
        status: r.status,
        hoursWorked: r.hours_worked,
        clockIn: r.clock_in,
        clockOut: r.clock_out
      }))
    };

    return summary;
  }
}

export default new AttendanceService();
