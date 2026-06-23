import mongoose from 'mongoose';
import { Employee } from '../api/src/modules/employee/models/employee.model';
import { Attendance } from '../api/src/modules/attendance/models/attendance.model';
import { User } from '../api/src/modules/auth/user.model';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';

async function seedJuneAttendance() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the owner (first user with owner role)
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.log('No owner user found. Please create an owner first.');
      process.exit(1);
    }
    console.log(`Using owner: ${owner.email}`);

    // Get all employees
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees`);
    
    if (employees.length > 0) {
      const statuses = [...new Set(employees.map(e => e.status as string))];
      console.log(`Employee statuses in DB: ${statuses.join(', ')}`);
    }

    if (employees.length === 0) {
      console.log('No employees found. Please seed employees first.');
      process.exit(1);
    }

    // Clear existing June 2026 attendance records
    const juneStart = new Date('2026-06-01T00:00:00Z');
    const juneEnd = new Date('2026-06-30T23:59:59Z');
    
    const deletedCount = await Attendance.deleteMany({
      date: { $gte: juneStart, $lte: juneEnd }
    });
    console.log(`Deleted ${deletedCount.deletedCount} existing June records`);

    // Create attendance records for June 2026 (Monday-Friday, 8 hours each)
    const attendanceRecords: any[] = [];
    
    for (const emp of employees) {
      // Generate attendance for each weekday in June 2026
      for (let day = 1; day <= 30; day++) {
        const date = new Date(2026, 5, day); // Month is 0-indexed, so 5 = June
        const dayOfWeek = date.getDay();
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }

        // Create clock in around 8 AM with small random variation
        const clockInTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, Math.floor(Math.random() * 30));
        
        // Clock out around 5 PM (17:00)
        const clockOutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 0);
        
        const hoursWorked = 8 + (Math.random() * 0.5 - 0.25); // 8 hours ±15 mins
        
        attendanceRecords.push({
          ownerId: owner._id,
          employeeId: emp._id,
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          clockInTime: clockInTime,
          clockOutTime: clockOutTime,
          totalHours: Math.round(hoursWorked * 100) / 100,
          status: 'present',
        });
      }
    }

    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
      console.log(`✅ Successfully created ${attendanceRecords.length} attendance records for June 2026`);
      console.log(`   - Per employee: ~${Math.round(attendanceRecords.length / employees.length)} working days`);
      console.log(`   - Average hours per day: 8`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding June attendance:', error);
    process.exit(1);
  }
}

seedJuneAttendance();
