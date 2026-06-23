import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  password: String,
  role: String,
  isActive: Boolean,
  refreshToken: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  phone: String,
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  position: String,
  jobTitle: String,
  employmentType: String,
  startDate: Date,
  endDate: Date,
  salary: Number,
  salaryType: String,
  status: String,
  profileImage: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model('User', userSchema);
const EmployeeModel = mongoose.model('Employee', employeeSchema);

async function linkUsersToEmployees() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);

    console.log('Connected to MongoDB');

    // Get all employees
    const employees = await EmployeeModel.find({}).exec();
    console.log(`Found ${employees.length} employees`);

    let linkedCount = 0;
    let alreadyLinkedCount = 0;
    let notFoundCount = 0;

    for (const employee of employees) {
      // Skip if already linked
      if (employee.userId) {
        console.log(`✓ Employee ${employee.email} already linked to user ${employee.userId}`);
        alreadyLinkedCount++;
        continue;
      }

      // Find user by email
      const user = await UserModel.findOne({ email: employee.email }).exec();

      if (user) {
        // Update employee with userId
        await EmployeeModel.findByIdAndUpdate(
          employee._id,
          { userId: user._id },
          { new: true }
        ).exec();

        console.log(`✓ Linked employee ${employee.email} (${employee._id}) to user ${user._id}`);
        linkedCount++;
      } else {
        console.log(`✗ No user found for employee ${employee.email}`);
        notFoundCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Newly linked: ${linkedCount}`);
    console.log(`Already linked: ${alreadyLinkedCount}`);
    console.log(`Not found: ${notFoundCount}`);
    console.log(`Total processed: ${linkedCount + alreadyLinkedCount + notFoundCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error linking users to employees:', error);
    process.exit(1);
  }
}

linkUsersToEmployees();
