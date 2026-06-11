import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../api/src/modules/auth/user.model';
import { Employee } from '../api/src/modules/employee/models/employee.model';
import { DepartmentModel } from '../api/src/modules/employee/models/department.model';

dotenv.config();

type SeedUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'manager' | 'hr' | 'owner' | 'employee';
  department?: string;
  position?: string;
  jobTitle?: string;
  salary?: number;
  asEmployee?: boolean;
};

const users: SeedUser[] = [
  { email: 'owner@kagohc.com', password: 'owner123', firstName: 'Olivia', lastName: 'Owner', role: 'owner' },
  { email: 'manager@kagohc.com', password: 'manager123', firstName: 'Mandla', lastName: 'Manager', role: 'manager', department: 'Sales', position: 'Sales Manager', jobTitle: 'Sales Manager', salary: 65000, asEmployee: true },
  { email: 'hr@kagohc.com', password: 'hr123', firstName: 'Hannah', lastName: 'Human', role: 'hr', department: 'HR', position: 'HR Officer', jobTitle: 'HR Officer', salary: 48000, asEmployee: true },
  { email: 'employee@kagohc.com', password: 'employee123', firstName: 'Evan', lastName: 'Employee', role: 'employee', department: 'IT', position: 'Software Developer', jobTitle: 'Developer', salary: 55000, asEmployee: true },
  { email: 'thabo@kagohc.com', password: 'employee123', firstName: 'Thabo', lastName: 'Nkosi', role: 'employee', department: 'Sales', position: 'Sales Representative', jobTitle: 'Sales Rep', salary: 35000, asEmployee: true },
  { email: 'lerato@kagohc.com', password: 'employee123', firstName: 'Lerato', lastName: 'Molefe', role: 'employee', department: 'Marketing', position: 'Marketing Specialist', jobTitle: 'Marketing Specialist', salary: 38000, asEmployee: true },
  { email: 'sipho@kagohc.com', password: 'employee123', firstName: 'Sipho', lastName: 'Dlamini', role: 'employee', department: 'IT', position: 'IT Support', jobTitle: 'IT Support', salary: 32000, asEmployee: true },
];

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const departments = await DepartmentModel.find({});
  const deptByName = new Map(departments.map((d: any) => [d.name, d._id]));

  let empCounter = await Employee.countDocuments();

  for (const u of users) {
    let user = await UserModel.findOne({ email: u.email });
    const hashedPassword = await bcrypt.hash(u.password, 10);

    if (user) {
      user.password = hashedPassword;
      user.role = u.role;
      user.firstName = u.firstName;
      user.lastName = u.lastName;
      user.isActive = true;
      await user.save();
      console.log(`Updated user: ${u.email} (${u.role})`);
    } else {
      user = await UserModel.create({
        email: u.email,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: true,
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    }

    if (u.asEmployee) {
      const existingEmployee = await Employee.findOne({ email: u.email });
      if (!existingEmployee) {
        empCounter += 1;
        await Employee.create({
          employeeId: `EMP${String(empCounter).padStart(4, '0')}`,
          userId: user._id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: '+27 11 000 0000',
          departmentId: u.department ? deptByName.get(u.department) : undefined,
          position: u.position,
          jobTitle: u.jobTitle,
          employmentType: 'permanent',
          startDate: new Date(2024, 0, 15),
          salary: u.salary,
          salaryType: 'monthly',
          status: 'active',
        });
        console.log(`  -> Created employee record for ${u.email}`);
      } else {
        if (!existingEmployee.userId) {
          existingEmployee.userId = user._id as any;
          await existingEmployee.save();
        }
        console.log(`  -> Employee record already exists for ${u.email}`);
      }
    }
  }

  console.log('\nDone seeding users and employees.');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
};

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
