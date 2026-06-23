import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employee/routes/employeeRoutes';
import onboardingRoutes from './modules/employee/routes/onboarding.routes';
import attendanceRoutes from './modules/attendance/routes/attendance.routes';
import usersRoutes from './modules/users/users.routes';
import ownerRoutes from './modules/owner/routes/ownerRoutes';
import departmentRoutes from './modules/owner/routes/department.routes';
import roleRoutes from './modules/owner/routes/role.routes';
import payrollRoutes from './modules/payroll/routes/payrollRoutes';
import payrollSettingsRoutes from './modules/payroll/routes/payrollSettingsRoutes';
import leaveRoutes from './modules/leave/routes/leave.routes';
import leaveRulesRoutes from './modules/leave/routes/leave-rules.routes';
import leavePolicyRoutes from './modules/owner/routes/leave-policy.routes';
import taxRoutes from './modules/tax/routes/taxRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/owner', ownerRoutes);
app.use('/api/v1/department', departmentRoutes);
app.use('/api/v1/role', roleRoutes);
app.use('/api/v1/payroll', payrollSettingsRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/leave-rules', leaveRulesRoutes);
app.use('/api/v1/owner/leave-policies', leavePolicyRoutes);
app.use('/api/v1/owner/tax-rates', taxRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});

export default app;
