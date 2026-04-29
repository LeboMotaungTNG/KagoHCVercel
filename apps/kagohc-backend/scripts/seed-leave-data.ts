import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Models
const leaveSchema = new mongoose.Schema({
  leave_id: { type: Number, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  full_name: String,
  employee_code: String,
  department: String,
  position: String,
  leave_type: String,
  start_date: Date,
  end_date: Date,
  total_days: Number,
  reason: String,
  status: { type: String, default: 'pending' },
  submitted_at: { type: Date, default: Date.now },
  reviewed_by: mongoose.Schema.Types.ObjectId,
  reviewer_name: String,
  reviewed_at: Date,
  rejection_reason: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
  employeeId: String,
  userId: mongoose.Schema.Types.ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  department: String,
  position: String
});

const LeaveModel = mongoose.model('Leave', leaveSchema);
const EmployeeModel = mongoose.model('Employee', employeeSchema);

async function seedLeaveData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);

    console.log('Connected to MongoDB');

    // Get some employees
    const employees = await EmployeeModel.find({}).limit(5).exec();
    console.log(`Found ${employees.length} employees`);

    if (employees.length === 0) {
      console.log('No employees found. Please seed employees first.');
      await mongoose.disconnect();
      return;
    }

    // Get the last leave_id
    const lastLeave = await LeaveModel.findOne().sort({ leave_id: -1 }).exec();
    let nextLeaveId = lastLeave && lastLeave.leave_id ? lastLeave.leave_id + 1 : 1001;

    // Create sample leave requests
    const leaveRequests = [];
    const leaveTypes = ['annual', 'sick', 'maternity', 'paternity', 'unpaid'];
    const statuses = ['pending', 'approved', 'rejected'];

    for (let i = 0; i < employees.length * 2; i++) {
      const employee = employees[i % employees.length];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      leaveRequests.push({
        leave_id: nextLeaveId++,
        employee_id: employee._id,
        full_name: `${employee.firstName} ${employee.lastName}`,
        employee_code: employee.employeeId,
        department: employee.department || 'General',
        position: employee.position || 'Employee',
        leave_type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason: `Sample leave request for ${employee.firstName}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        submitted_at: new Date(),
        createdBy: employee.userId,
        updatedBy: employee.userId
      });
    }

    // Insert leave requests
    const created = await LeaveModel.insertMany(leaveRequests);
    console.log(`\n✓ Created ${created.length} leave requests`);

    // Print summary
    console.log('\n=== Leave Requests Created ===');
    created.forEach((leave: any) => {
      console.log(`- Leave #${leave.leave_id}: ${leave.full_name} (${leave.leave_type})`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding leave data:', error);
    process.exit(1);
  }
}

seedLeaveData();
