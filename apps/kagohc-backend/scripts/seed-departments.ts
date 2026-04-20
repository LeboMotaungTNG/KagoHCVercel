import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DepartmentModel } from '../api/src/modules/employee/models/department.model';
import { UserModel } from '../api/src/modules/auth/user.model';

dotenv.config();

const seedDepartments = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get admin user
    const admin = await UserModel.findOne({ email: 'admin@tng.com' }) || await UserModel.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    const departments = [
      {
        name: 'Sales',
        description: 'Sales Department',
        budget: 50000,
        headCount: 10,
        location: 'Johannesburg',
        contactEmail: 'sales@kagohc.com',
        contactPhone: '+27 11 123 4567',
        isActive: true,
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        name: 'Marketing',
        description: 'Marketing Department',
        budget: 30000,
        headCount: 5,
        location: 'Johannesburg',
        contactEmail: 'marketing@kagohc.com',
        contactPhone: '+27 11 123 4568',
        isActive: true,
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        name: 'IT',
        description: 'Information Technology Department',
        budget: 80000,
        headCount: 15,
        location: 'Johannesburg',
        contactEmail: 'it@kagohc.com',
        contactPhone: '+27 11 123 4569',
        isActive: true,
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        name: 'HR',
        description: 'Human Resources Department',
        budget: 25000,
        headCount: 3,
        location: 'Johannesburg',
        contactEmail: 'hr@kagohc.com',
        contactPhone: '+27 11 123 4570',
        isActive: true,
        createdBy: admin._id,
        updatedBy: admin._id
      }
    ];

    for (const deptData of departments) {
      const existing = await DepartmentModel.findOne({ name: deptData.name });
      if (!existing) {
        await DepartmentModel.create(deptData);
        console.log(`✅ Created department: ${deptData.name}`);
      } else {
        console.log(`✅ Department already exists: ${deptData.name}`);
      }
    }

    console.log('✅ Departments seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding departments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

seedDepartments();