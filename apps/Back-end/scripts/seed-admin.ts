import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../api/src/modules/auth/user.model';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ email: 'admin@kagohc.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Active:', existingAdmin.isActive);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('admin12', 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Admin password updated');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin12', 10);

    // Create admin user
    const admin = new UserModel({
      email: 'admin@kagohc.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@kagohc.com');
    console.log('Password: admin12');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

seedAdmin();