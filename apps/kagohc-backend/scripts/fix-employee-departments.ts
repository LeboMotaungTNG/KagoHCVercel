import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from '../api/src/modules/employee/models/employee.model';
import { DepartmentModel } from '../api/src/modules/employee/models/department.model';
import { UserModel } from '../api/src/modules/auth/user.model';

dotenv.config();

const fixEmployeeDepartments = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find employees where department is a string
    const employees = await Employee.find({
      department: { $type: 'string' }
    });

    console.log(`Found ${employees.length} employees with string departments`);

    for (const employee of employees) {
      const deptValue = employee.department as any; // It's a string
      if (deptValue === 'undefined' || !deptValue) {
        // Set to default department and fix other fields
        const defaultDept = await DepartmentModel.findOne({ name: 'Sales' });
        const admin = await UserModel.findOne({ role: 'admin' });
        if (defaultDept && admin) {
          employee.department = defaultDept._id;
          employee.createdBy = admin._id;
          employee.updatedBy = admin._id;
          employee.startDate = employee.startDate || new Date();
          employee.address = employee.address || {
            street: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            zipCode: '0000',
            country: 'South Africa'
          };
          employee.employmentType = (employee as any).employmentType === 'Full-time' ? 'full-time' : ((employee as any).employmentType || 'full-time');
          await employee.save({ validateBeforeSave: false });
          console.log(`✅ Fixed employee ${employee.employeeId}: set defaults`);
        } else {
          console.log(`❌ Cannot fix employee ${employee.employeeId}: missing defaults`);
        }
        continue;
      }
      
      // Check if it's a valid ObjectId string
      if (mongoose.Types.ObjectId.isValid(deptValue)) {
        employee.department = new mongoose.Types.ObjectId(deptValue);
        await employee.save();
        console.log(`✅ Fixed employee ${employee.employeeId}: converted to ObjectId`);
      } else {
        // Try to find by name
        const dept = await DepartmentModel.findOne({ name: deptValue });
        if (dept) {
          employee.department = dept._id;
          await employee.save();
          console.log(`✅ Fixed employee ${employee.employeeId}: ${deptValue} -> ${dept._id}`);
        } else {
          console.log(`❌ Department "${deptValue}" not found for employee ${employee.employeeId}`);
        }
      }
    }

    console.log('✅ Employee departments fixed');

  } catch (error) {
    console.error('❌ Error fixing employee departments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

fixEmployeeDepartments();