import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employee/routes/employee.routes';
import departmentRoutes from './modules/employee/routes/department.routes';
import attendanceRoutes from './modules/attendance/routes/attendance.routes';
import leaveRoutes from './modules/leave/routes/leave.routes';
import payrollRoutes from './modules/payroll/routes/payroll.routes';
import disciplinaryRoutes from './modules/disciplinary/routes/disciplinary.routes';
import kpiRoutes from './modules/kpi/routes/kpi.routes';
import auditLogRoutes from './modules/audit/routes/adminRoutes';
import onboardingRoutes from './modules/onboarding/routes/onboarding.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/disciplinary', disciplinaryRoutes);
app.use('/api/v1/kpi', kpiRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV, version: '1.0.0' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

export default app;

