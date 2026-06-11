import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { KpiPeriod, IKpiPeriod } from '../api/src/modules/kpi/models/KpiPeriod';
import KpiTemplate from '../api/src/modules/kpi/models/KpiTemplate';

dotenv.config();

const seedKpiData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing KPI data
    await KpiPeriod.deleteMany({});
    await KpiTemplate.deleteMany({});
    console.log('✅ Cleared existing KPI data');

    // Create a dummy admin ID for testing
    const adminId = new mongoose.Types.ObjectId();

    // Create KPI Templates
    const templates = await KpiTemplate.insertMany([
      {
        name: 'Productivity KPI',
        category: 'individual',
        description: 'Measure work output and efficiency',
        frequency: 'quarterly',
        metrics: [
          { name: 'Tasks Completed', description: 'Number of tasks completed in the period', weight: 50, unit: 'count', target: 100, isRequired: true },
          { name: 'Quality Score', description: 'Overall quality rating of delivered work', weight: 50, unit: 'percentage', target: 95, isRequired: true }
        ],
        isActive: true,
        createdBy: adminId
      },
      {
        name: 'Quality KPI',
        category: 'individual',
        description: 'Quality of work output',
        frequency: 'quarterly',
        metrics: [
          { name: 'Error Rate', description: 'Percentage of work requiring rework', weight: 100, unit: 'percentage', target: 5, isRequired: true }
        ],
        isActive: true,
        createdBy: adminId
      },
      {
        name: 'Attendance KPI',
        category: 'individual',
        description: 'Punctuality and attendance record',
        frequency: 'monthly',
        metrics: [
          { name: 'Present Days', description: 'Number of days present in the month', weight: 100, unit: 'count', target: 22, isRequired: true }
        ],
        isActive: true,
        createdBy: adminId
      }
    ]);
    console.log('✅ Created KPI templates');

    // Create KPI Periods
    const now = new Date();
    
    const periods = await KpiPeriod.insertMany([
      {
        name: 'Q1 2026',
        type: 'quarterly',
        openDate: new Date(2026, 0, 1), // Jan 1, 2026
        closeDate: new Date(2026, 2, 31), // Mar 31, 2026
        reviewStartDate: new Date(2026, 3, 1), // Apr 1, 2026
        reviewEndDate: new Date(2026, 3, 15), // Apr 15, 2026
        status: 'upcoming',
        createdBy: adminId
      },
      {
        name: 'Q2 2026',
        type: 'quarterly',
        openDate: new Date(2026, 3, 1), // Apr 1, 2026
        closeDate: new Date(2026, 5, 30), // Jun 30, 2026
        reviewStartDate: new Date(2026, 6, 1), // Jul 1, 2026
        reviewEndDate: new Date(2026, 6, 15), // Jul 15, 2026
        status: 'upcoming',
        createdBy: adminId
      },
      {
        name: 'Current Active Period',
        type: 'quarterly',
        openDate: new Date(now.getFullYear(), now.getMonth() - 1, 1), // Last month
        closeDate: new Date(now.getFullYear(), now.getMonth() + 1, 0), // Next month end
        reviewStartDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
        reviewEndDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
        status: 'open',
        createdBy: adminId
      }
    ]);
    
    console.log('✅ Created KPI periods:');
    periods.forEach((p: IKpiPeriod) => {
      console.log(`   - ${p.name}: ${p.status}`);
      console.log(`     Open: ${p.openDate.toDateString()}`);
      console.log(`     Close: ${p.closeDate.toDateString()}`);
      console.log(`     Review: ${p.reviewStartDate.toDateString()} - ${p.reviewEndDate.toDateString()}`);
    });

    console.log('\n✅ KPI seed data complete!');
    console.log('\n📝 Test these endpoints:');
    console.log('   GET  /api/v1/kpi/periods');
    console.log('   GET  /api/v1/kpi/periods/current');
    console.log('   POST /api/v1/kpi/periods (admin only)');
    console.log('   GET  /api/v1/kpi/periods/:id/status');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

seedKpiData();
