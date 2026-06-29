import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Employee from '../models/Employee';
import { User } from '../../auth/user.model';

// ─── Helper: resolve the tenant ownerId from the authenticated user ──────────
// Owners: ownerId === _id (they are the root of their own tenant)
// Admins/managers: ownerId points to their owner
function resolveTenantOwnerId(req: Request): mongoose.Types.ObjectId {
  const user = (req as any).user;
  return user.role === 'owner' ? user._id : user.ownerId;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Get current user's employee profile
export const getMyEmployeeProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const employee = await Employee.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all employees — TENANT SCOPED
// Only returns employees whose ownerId matches the authenticated user's tenant.
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { search, isManager } = req.query;

    // ── TENANT FILTER ────────────────────────────────────────────────────────
    // This is the critical fix: every query is scoped to the authenticated
    // user's tenant. Without this, every owner can see every employee on the
    // entire platform.
    const tenantOwnerId = resolveTenantOwnerId(req);
    const filter: any = { ownerId: tenantOwnerId };
    // ────────────────────────────────────────────────────────────────────────

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (isManager === 'true') {
      filter.isManager = true;
    } else if (isManager === 'false') {
      filter.isManager = { $ne: true };
    }

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single employee by ID — verify it belongs to the caller's tenant
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const tenantOwnerId = resolveTenantOwnerId(req);
    const employee = await Employee.findOne({
      _id: req.params.id,
      ownerId: tenantOwnerId,
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create employee — always scoped to the caller's tenant
export const createEmployee = async (req: Request, res: Response) => {
  try {
    // ── TENANT FIX ───────────────────────────────────────────────────────────
    // Previously used req.user._id as ownerId, which is wrong when an admin
    // creates an employee (admin._id !== owner._id). We now always resolve
    // the tenant root so the new employee lands in the right company.
    const currentUserId = (req as any).user?._id;
    const ownerId = resolveTenantOwnerId(req);
    // ────────────────────────────────────────────────────────────────────────

    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      startDate,
      salary,
      userId,
      ...rest
    } = req.body;

    let finalUserId = userId;
    let generatedPassword: string | null = null;

    if (!finalUserId) {
      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const user = await User.create({
        email,
        password: hashedPassword,
        role: 'user',
        firstName,
        lastName,
        ownerId,
      });

      finalUserId = user._id;
      generatedPassword = plainPassword;
    }

    const employeeId = `EMP${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;

    const employee = await Employee.create({
      ownerId,
      userId: finalUserId,
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      hireDate: new Date(startDate || req.body.hireDate),
      salary,
      status: 'active',
      createdBy: currentUserId,
      ...rest,
    });

    res.status(201).json({
      success: true,
      data: employee,
      generatedPassword,
      message: 'Employee created successfully',
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update employee — verify tenant ownership before updating
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const tenantOwnerId = resolveTenantOwnerId(req);
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, ownerId: tenantOwnerId },
      req.body,
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete employee — verify tenant ownership before deleting
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const tenantOwnerId = resolveTenantOwnerId(req);
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      ownerId: tenantOwnerId,
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk import employees
export const bulkImportEmployees = async (req: Request, res: Response) => {
  try {
    const { employees } = req.body;
    const currentUserId = (req as any).user?._id;
    const currentUserRole = (req as any).user?.role;

    // ── TENANT FIX ───────────────────────────────────────────────────────────
    const ownerId = resolveTenantOwnerId(req);
    // ────────────────────────────────────────────────────────────────────────

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ success: false, message: 'No employees provided for bulk creation' });
    }

    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners and admins can create employees' });
    }

    const results = { success: [] as any[], failed: [] as any[], successCount: 0, failedCount: 0 };

    for (const emp of employees) {
      try {
        const employeeCode = emp.employee_code || `EMP${Date.now()}${Math.floor(Math.random() * 10000)}`;

        const existingEmployee = await Employee.findOne({ email: emp.email });
        if (existingEmployee) {
          results.failed.push({ email: emp.email, reason: 'Employee already exists' });
          results.failedCount++;
          continue;
        }

        const fullName = (emp.full_name || '').trim();
        const firstName = fullName.split(' ')[0] || '';
        const lastName = fullName.split(' ').slice(1).join(' ') || '';
        const userPassword = emp.password || 'Welcome123';

        const user = await User.create({
          email: emp.email,
          password: userPassword,
          firstName,
          lastName,
          role: emp.role || 'user',
          ownerId,
        });

        const employee = await Employee.create({
          firstName,
          lastName,
          email: emp.email,
          phone: emp.phone || '',
          department: emp.department || '',
          position: emp.position || '',
          employeeId: employeeCode,
          status: 'active',
          salary: emp.salary || 0,
          startDate: emp.start_date || emp.hireDate || new Date(),
          userId: user._id,
          ownerId,
          createdBy: currentUserId,
        });

        results.success.push({
          email: emp.email,
          employeeCode,
          name: fullName,
          password: userPassword,
        });
        results.successCount++;
      } catch (error: any) {
        results.failed.push({ email: emp.email, reason: error.message });
        results.failedCount++;
      }
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `Processed ${employees.length} employees. ${results.successCount} succeeded, ${results.failedCount} failed.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Promote employee to manager
export const promoteToManager = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { managerLevel, reason } = req.body;
    const promotedBy = (req as any).user?._id;
    const tenantOwnerId = resolveTenantOwnerId(req);

    const employee = await Employee.findOne({ _id: id, ownerId: tenantOwnerId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (employee.isManager) {
      return res.status(400).json({ success: false, message: 'Employee is already a manager' });
    }

    employee.isManager = true;
    employee.managerLevel = managerLevel || 'manager';
    employee.managerSince = new Date();
    employee.promotedBy = promotedBy;

    if (!employee.promotionHistory) employee.promotionHistory = [];
    employee.promotionHistory.push({
      previousRole: 'employee',
      newRole: managerLevel || 'manager',
      promotedBy,
      promotedAt: new Date(),
      reason: reason || `Promoted to ${managerLevel || 'manager'}`,
    } as any);

    await employee.save();

    await User.findOneAndUpdate(
      { employeeId: employee._id },
      { role: 'admin', isManager: true }
    );

    res.json({
      success: true,
      message: `${employee.firstName} ${employee.lastName} promoted to manager`,
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Demote employee from manager
export const demoteFromManager = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const demotedBy = (req as any).user?._id;
    const tenantOwnerId = resolveTenantOwnerId(req);

    const employee = await Employee.findOne({ _id: id, ownerId: tenantOwnerId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (!employee.isManager) {
      return res.status(400).json({ success: false, message: 'Employee is not a manager' });
    }

    const previousRole = employee.managerLevel || 'manager';

    employee.isManager = false;
    employee.managerLevel = undefined;
    employee.managerSince = undefined;

    if (!employee.demotionHistory) employee.demotionHistory = [];
    employee.demotionHistory.push({
      previousRole,
      newRole: 'employee',
      demotedBy,
      demotedAt: new Date(),
      reason: reason || 'Demoted from manager role',
    } as any);

    await employee.save();

    await User.findOneAndUpdate(
      { employeeId: employee._id },
      { role: 'user', isManager: false }
    );

    res.json({
      success: true,
      message: `${employee.firstName} ${employee.lastName} demoted to employee`,
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create employee with onboarding workflow
export const createEmployeeWithOnboarding = async (req: Request, res: Response) => {
  try {
    const {
      firstName, lastName, email, phone, department, position,
      hireDate, hire_date, salary, annual_salary,
      assignedMentorId, assigned_mentor_id,
      createAccount, create_account, password, start_date,
    } = req.body;

    const currentUserId = (req as any).user?._id;
    const currentUserRole = (req as any).user?.role;

    // ── TENANT FIX ───────────────────────────────────────────────────────────
    const ownerId = resolveTenantOwnerId(req);
    // ────────────────────────────────────────────────────────────────────────

    const shouldCreateAccount = createAccount !== false && create_account !== false;
    const hireDateValue = hireDate || hire_date || start_date || new Date();
    const salaryValue = salary || annual_salary || 0;
    const mentorId = assignedMentorId || assigned_mentor_id || null;
    const passwordValue = password || 'Welcome123!';

    if (currentUserRole !== 'owner' && currentUserRole !== 'admin' && currentUserRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only owners, admins, and authenticated users can create employees',
      });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists',
      });
    }

    const count = await Employee.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}${Math.floor(Math.random() * 1000)}`;
    const employeeCode = employeeId;

    const onboardingSteps = [
      { stepNumber: 1,  name: 'Pre-Hire Documentation',      status: 'pending' },
      { stepNumber: 2,  name: 'Background Check',            status: 'pending' },
      { stepNumber: 3,  name: 'IT Account Setup',            status: 'pending' },
      { stepNumber: 4,  name: 'Office Access Setup',         status: 'pending' },
      { stepNumber: 5,  name: 'Hardware Assignment',         status: 'pending' },
      { stepNumber: 6,  name: 'Payroll Setup',               status: 'pending' },
      { stepNumber: 7,  name: 'Benefits Enrollment',         status: 'pending' },
      { stepNumber: 8,  name: 'Policy Training',             status: 'pending' },
      { stepNumber: 9,  name: 'System Access & Tools',       status: 'pending' },
      { stepNumber: 10, name: 'First Day Orientation',       status: 'pending' },
      { stepNumber: 11, name: 'Team Introductions',          status: 'pending' },
      { stepNumber: 12, name: 'Goal Setting & Documentation',status: 'pending' },
    ];

    let userId = null;
    let userAccountInfo: any = null;

    if (shouldCreateAccount && email) {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        const userAccount = await User.create({
          email,
          password: passwordValue,
          role: 'user',
          firstName,
          lastName,
          ownerId,
        });
        userId = userAccount._id;
        userAccountInfo = { email: userAccount.email, role: userAccount.role, id: userAccount._id };
      } else {
        userId = existingUser._id;
        userAccountInfo = { email: existingUser.email, role: existingUser.role, id: existingUser._id };
      }
    }

    const employee = await Employee.create({
      employeeCode,
      employeeId,
      firstName,
      lastName,
      email,
      phone: phone || 'N/A',
      startDate: new Date(hireDateValue),
      salary: salaryValue,
      status: 'active',
      bankName: req.body.bankName || 'N/A',
      bankAccountNumber: req.body.bankAccountNumber || 'N/A',
      bankBranchCode: req.body.bankBranchCode || 'N/A',
      taxReferenceNumber: req.body.taxReferenceNumber || 'N/A',
      uifReferenceNumber: req.body.uifReferenceNumber || 'N/A',
      department: department || 'General',
      position: position || 'Employee',
      userId,
      ownerId,
      createdBy: currentUserId,
      onboardingStatus: 'in_progress',
      onboardingProgress: 0,
      onboardingStartDate: new Date(),
      onboardingSteps,
      firstDayChecklist: {
        hardwareReceived: false,
        softwareAccess: false,
        badgeReceived: false,
        deskAssigned: false,
        orientationCompleted: false,
      },
      assignedMentorId: mentorId,
      welcomeEmailSent: false,
      isOnProbation: true,
      probationStartDate: new Date(),
      probationEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      probationStatus: 'active',
      isManager: false,
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { employeeId: employee._id });
    }

    res.status(201).json({
      success: true,
      message: `Employee ${firstName} ${lastName} created and onboarding started`,
      data: { ...employee.toObject(), userAccount: userAccountInfo },
    });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get onboarding status for an employee
export const getOnboardingStatus = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const tenantOwnerId = resolveTenantOwnerId(req);

    const employee = await Employee.findOne({ _id: employeeId, ownerId: tenantOwnerId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const totalSteps = (employee as any).onboardingSteps?.length || 12;
    const completedSteps = (employee as any).onboardingSteps?.filter((s: any) => s.status === 'completed').length || 0;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const pendingSteps = (employee as any).onboardingSteps?.filter((s: any) => s.status === 'pending').slice(0, 3) || [];

    res.json({
      success: true,
      data: {
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        onboardingStatus: employee.onboardingStatus,
        onboardingProgress: progressPercentage,
        totalSteps,
        completedSteps,
        isOnProbation: employee.isOnProbation,
        probationStatus: employee.probationStatus,
        probationEndDate: employee.probationEndDate,
        daysUntilProbationEnd: employee.probationEndDate
          ? Math.ceil((new Date(employee.probationEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        nextPendingSteps: pendingSteps,
        firstDayChecklist: (employee as any).firstDayChecklist,
        assignedMentorId: (employee as any).assignedMentorId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a specific onboarding step
export const updateOnboardingStep = async (req: Request, res: Response) => {
  try {
    const { employeeId, stepNumber } = req.params;
    const { status, notes, documents } = req.body;
    const completedBy = (req as any).user?._id;
    const tenantOwnerId = resolveTenantOwnerId(req);

    const employee = await Employee.findOne({ _id: employeeId, ownerId: tenantOwnerId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const step = employee.onboardingSteps?.find(s => s.stepNumber === parseInt(stepNumber));
    if (!step) {
      return res.status(404).json({ success: false, message: 'Onboarding step not found' });
    }

    step.status = status || 'in_progress';
    if (status === 'completed') {
      step.completedAt = new Date();
      step.completedBy = new mongoose.Types.ObjectId(completedBy);
    }
    if (notes) step.notes = notes;
    if (documents) step.documents = documents;

    const totalSteps = employee.onboardingSteps?.length || 12;
    const completedSteps = employee.onboardingSteps?.filter(s => s.status === 'completed').length || 0;
    employee.onboardingProgress = Math.round((completedSteps / totalSteps) * 100);

    if (completedSteps === totalSteps) {
      employee.onboardingStatus = 'completed';
      employee.onboardingCompletedDate = new Date();
    }

    await employee.save();

    res.json({
      success: true,
      message: `Step ${stepNumber} updated to ${status}`,
      data: {
        employeeId: employee._id,
        stepNumber: parseInt(stepNumber),
        newStatus: status,
        onboardingProgress: employee.onboardingProgress,
        onboardingStatus: employee.onboardingStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete probation period
export const completeProbation = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { completionNotes, rating } = req.body;
    const tenantOwnerId = resolveTenantOwnerId(req);

    const employee = await Employee.findOne({ _id: employeeId, ownerId: tenantOwnerId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (!employee.isOnProbation) {
      return res.status(400).json({ success: false, message: 'Employee is not on probation' });
    }

    employee.isOnProbation = false;
    employee.probationStatus = 'completed';
    employee.probationReviewDates = employee.probationReviewDates || [];
    employee.probationReviewDates.push(new Date());

    await employee.save();

    res.json({
      success: true,
      message: `Probation successfully completed for ${employee.firstName} ${employee.lastName}`,
      data: {
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        isOnProbation: employee.isOnProbation,
        probationStatus: employee.probationStatus,
        probationCompletedDate: employee.probationReviewDates?.[employee.probationReviewDates.length - 1],
        rating: rating || 'good',
        completionNotes: completionNotes || '',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update first day checklist
export const updateFirstDayChecklist = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { hardwareReceived, softwareAccess, badgeReceived, deskAssigned, orientationCompleted } = req.body;
    const tenantOwnerId = resolveTenantOwnerId(req);

    const employee = await Employee.findOne({ _id: employeeId, ownerId: tenantOwnerId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (employee.firstDayChecklist) {
      if (hardwareReceived !== undefined) employee.firstDayChecklist.hardwareReceived = hardwareReceived;
      if (softwareAccess !== undefined) employee.firstDayChecklist.softwareAccess = softwareAccess;
      if (badgeReceived !== undefined) employee.firstDayChecklist.badgeReceived = badgeReceived;
      if (deskAssigned !== undefined) employee.firstDayChecklist.deskAssigned = deskAssigned;
      if (orientationCompleted !== undefined) employee.firstDayChecklist.orientationCompleted = orientationCompleted;
    }

    const checklist = employee.firstDayChecklist;
    const allComplete =
      checklist?.hardwareReceived &&
      checklist?.softwareAccess &&
      checklist?.badgeReceived &&
      checklist?.deskAssigned &&
      checklist?.orientationCompleted;

    await employee.save();

    res.json({
      success: true,
      message: 'First day checklist updated',
      data: {
        employeeId: employee._id,
        firstDayChecklist: employee.firstDayChecklist,
        allItemsComplete: allComplete,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};