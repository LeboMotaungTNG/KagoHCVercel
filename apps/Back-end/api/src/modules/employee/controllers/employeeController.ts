import { Request, Response } from 'express';
import Employee from '../models/Employee';
import { User } from '../../auth/user.model';
import bcrypt from 'bcryptjs';

// Generate random password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// @desc    Create employee with auto-user creation
// @route   POST /api/v1/employees
// @access  Private (Owner/Admin)
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const { email, firstName, lastName, phone, position, department, startDate, salary, ...rest } = req.body;
    
    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email, ownerId });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }
    
    // Generate random password for user account
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Create user account
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'user',
      firstName,
      lastName,
      ownerId
    });
    
    // Calculate probation dates (90 days from start)
    const startDateObj = new Date(startDate);
    const probationEndDate = new Date(startDateObj);
    probationEndDate.setDate(probationEndDate.getDate() + 90);
    
    // Create employee
    const employee = await Employee.create({
      ownerId,
      userId: user._id,
      email,
      firstName,
      lastName,
      phone,
      position,
      department,
      startDate: startDateObj,
      salary,
      employeeCode: `EMP${Date.now().toString().slice(-6)}`,
      isOnProbation: true,
      probationStartDate: startDateObj,
      probationEndDate,
      probationStatus: 'active',
      employmentStatus: 'active',
      onboardingStatus: 'not_started',
      ...rest
    });
    
    res.status(201).json({
      success: true,
      data: employee,
      generatedPassword: plainPassword,
      message: `Employee created. Login password: ${plainPassword}`
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all employees
// @route   GET /api/v1/employees
// @access  Private (Owner/Admin/Manager)
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    
    let query: any = { ownerId };
    
    // If manager, only see team members
    if (userRole === 'admin') {
      const employee = await Employee.findOne({ userId });
      if (employee) {
        query.reportsTo = employee._id;
      }
    }
    
    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single employee
// @route   GET /api/v1/employees/:id
// @access  Private
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const employee = await Employee.findOne({ _id: req.params.id, ownerId });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update employee
// @route   PUT /api/v1/employees/:id
// @access  Private (Owner/Admin)
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, data: employee, message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete employee
// @route   DELETE /api/v1/employees/:id
// @access  Private (Owner only)
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const employee = await Employee.findOneAndDelete({ _id: req.params.id, ownerId });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    // Also delete associated user
    const empUserId = (employee as any).userId;
    if (empUserId) {
      await User.findByIdAndDelete(empUserId);
    }
    
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Promote employee to manager
// @route   PUT /api/v1/employees/:id/promote
// @access  Private (Owner only)
export const promoteToManager = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const { managerLevel = 'manager', reason = 'Promoted to manager' } = req.body;
    const promotedBy = (req as any).user?.id;
    
    const employee = await Employee.findOne({ _id: req.params.id, ownerId });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    // Record promotion history
    const promotionRecord = {
      previousRole: employee.position,
      newRole: employee.position,
      promotedBy,
      promotedAt: new Date(),
      reason
    };
    
    // Update employee
    employee.isManager = true;
    employee.managerLevel = managerLevel;
    employee.managerSince = new Date();
    employee.promotedBy = promotedBy;
    employee.promotionHistory.push(promotionRecord);
    await employee.save();
    
    // ✅ CRITICAL: Update the user account role to 'admin'
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { 
        role: 'admin',
        isManager: true
      });
    }
    
    res.json({ success: true, data: employee, message: 'Employee promoted to manager successfully' });
  } catch (error) {
    console.error('Promote error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Demote manager to employee
// @route   PUT /api/v1/employees/:id/demote
// @access  Private (Owner only)
export const demoteFromManager = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const { reason = 'Demoted from manager' } = req.body;
    const demotedBy = (req as any).user?.id;
    
    const employee = await Employee.findOne({ _id: req.params.id, ownerId });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    if (!employee.isManager) {
      return res.status(400).json({ success: false, message: 'Employee is not a manager' });
    }
    
    // Record demotion history
    const demotionRecord = {
      previousRole: employee.position,
      newRole: employee.position,
      demotedBy,
      demotedAt: new Date(),
      reason
    };
    
    // Update employee
    employee.isManager = false;
    employee.managerLevel = undefined;
    employee.managerSince = undefined;
    employee.demotionHistory.push(demotionRecord);
    await employee.save();
    
    // ✅ Update user account role back to 'user'
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { 
        role: 'user',
        isManager: false
      });
    }
    
    res.json({ success: true, data: employee, message: 'Manager demoted successfully' });
  } catch (error) {
    console.error('Demote error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk import employees via CSV/JSON
// @route   POST /api/v1/employees/bulk-import
// @access  Private (Owner only)
export const bulkImportEmployees = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?.id;
    const { employees } = req.body;
    
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ success: false, message: 'No employees data provided' });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };
    
    for (const emp of employees) {
      try {
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        
        const user = await User.create({
          email: emp.email,
          password: hashedPassword,
          role: 'user',
          firstName: emp.firstName,
          lastName: emp.lastName,
          ownerId
        });
        
        await Employee.create({
          ownerId,
          userId: user._id,
          employeeCode: `EMP${Date.now().toString().slice(-6)}`,
          isOnProbation: true,
          probationStatus: 'active',
          employmentStatus: 'active',
          ...emp,
          startDate: emp.startDate ? new Date(emp.startDate) : new Date(),
        });
        
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ email: emp.email, error: (err as Error).message });
      }
    }
    
    res.json({ 
      success: true, 
      data: results,
      message: `Imported ${results.success} employees, ${results.failed} failed`
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get employee by user ID (for current logged-in user)
// @route   GET /api/v1/employees/me
// @access  Private
export const getMyEmployeeProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const employee = await Employee.findOne({ userId });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
