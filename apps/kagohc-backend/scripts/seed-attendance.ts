import mongoose from 'mongoose';
import { Employee } from '../api/src/modules/employee/models/employee.model';
import { Attendance } from '../api/src/modules/attendance/models/attendance.model';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';

async function seedAttendance() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all active employees
    const employees = await Employee.find({ status: 'active' }).limit(10);
    console.log(`Found ${employees.length} employees`);

    if (employees.length === 0) {
      console.log('No employees found. Please seed employees first.');
      process.exit(1);
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance records already exist for today
    const existingCount = await Attendance.countDocuments({ 
      date: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    if (existingCount > 0) {
      console.log(`Attendance records already exist for today (${existingCount}). Skipping seed.`);
      process.exit(0);
    }

    // Create attendance records for each employee
    const attendanceRecords = employees.map((emp, idx) => {
      const clockInTime = new Date(today.getTime() + (8 * 60 * 60 * 1000) + Math.random() * 30 * 60 * 1000);
      const clockOutTime = new Date(today.getTime() + (17 * 60 * 60 * 1000));
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      return {
        employee_id: emp._id,
        employeeId: emp.employeeId,
        employee_name: `${emp.firstName} ${emp.lastName}`,
        employee_code: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.departmentId?.toString() || 'General',
        date: clockInTime,
        clock_in: clockInTime,
        clockIn: clockInTime,
        clock_out: clockOutTime,
        clockOut: clockOutTime,
        hours_worked: Math.round(hoursWorked * 100) / 100,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        status: 'present',
        createdBy: emp.userId,
        updatedBy: emp.userId,
      };
    });

    await Attendance.insertMany(attendanceRecords);
    console.log(`Successfully created ${attendanceRecords.length} attendance records for today`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding attendance:', error);
    process.exit(1);
  }
}

seedAttendance();
