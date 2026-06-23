import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Employee from '../models/Employee';
import { User } from '../../auth/user.model';

// Helper function to generate passwords
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

// Get all employees
export const getEmployees = async (req: Request, res: Response) => {
    try {
      const { search, isManager } = req.query;
      const filter: any = {};
      
      // Add search filter
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
        ];
      }
      
      // Add manager status filter
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

// Get single employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create employee
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user?._id;

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

    // 1. Create user account if userId not provided
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

    // 2. Generate employeeId
    const employeeId = `EMP${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;

    // 3. Create employee with ALL fields
    const employee = await Employee.create({
      ownerId,
      userId: finalUserId, // CRITICAL: Save the userId!
      employeeId, // CRITICAL: Save the employeeId!
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      hireDate: new Date(startDate || req.body.hireDate),
      salary,
      status: 'active', // CRITICAL: Set status!
      createdBy: ownerId,
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

// Update employee
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete employee
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
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
    
    console.log(`Processing bulk create for ${employees?.length || 0} employees`);
    
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
        
        // Create USER ACCOUNT FIRST
        const user = await User.create({
          email: emp.email,
          password: userPassword,
          firstName: firstName,
          lastName: lastName,
          role: emp.role || 'user',
          ownerId: currentUserRole === 'owner' ? currentUserId : null,
        });
        console.log(`User account created for: ${emp.email}`);

        // Create employee record
        const employee = await Employee.create({
          firstName: firstName,
          lastName: lastName,
          email: emp.email,
          phone: emp.phone || '',
          department: emp.department || '',
          position: emp.position || '',
          employeeId: employeeCode,
          status: 'active',
          salary: emp.salary || 0,
          startDate: emp.start_date || emp.hireDate || new Date(),
          userId: user._id,
          ownerId: currentUserRole === 'owner' ? currentUserId : null,
          createdBy: currentUserId,
        });
        console.log(`Employee record created for: ${emp.email}`);
        
        results.success.push({ 
          email: emp.email, 
          employeeCode: employeeCode, 
          name: fullName,
          password: userPassword
        });
        results.successCount++;
        
      } catch (error: any) {
        console.error(`Error creating employee ${emp.email}:`, error.message);
        results.failed.push({ email: emp.email, reason: error.message });
        results.failedCount++;
      }
    }
    
    res.status(201).json({ 
      success: true, 
      data: results,
      message: `Processed ${employees.length} employees. ${results.successCount} succeeded, ${results.failedCount} failed.`
    });
    
  } catch (error: any) {
    console.error('Bulk employee creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Promote employee to manager
export const promoteToManager = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { managerLevel, reason } = req.body;
    const promotedBy = (req as any).user?._id;

    const employee = await Employee.findById(id);
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
      reason: reason || `Promoted to ${managerLevel || 'manager'}`
    } as any);
    
    await employee.save();

    // ✅ CRITICAL: Update the user account role to 'admin'
    await User.findOneAndUpdate(
      { employeeId: employee._id },
      { role: 'admin', isManager: true }
    );

    res.json({
      success: true,
      message: `${employee.firstName} ${employee.lastName} promoted to manager`,
      data: employee
    });
  } catch (error: any) {
    console.error('Promotion error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Demote employee from manager
export const demoteFromManager = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const demotedBy = (req as any).user?._id;

    const employee = await Employee.findById(id);
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
      reason: reason || 'Demoted from manager role'
    } as any);
    
    await employee.save();

    // ✅ Update user account role back to 'user'
    await User.findOneAndUpdate(
      { employeeId: employee._id },
      { role: 'user', isManager: false }
    );

    res.json({
      success: true,
      message: `${employee.firstName} ${employee.lastName} demoted to employee`,
      data: employee
    });
  } catch (error: any) {
    console.error('Demotion error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create employee with onboarding workflow
export const createEmployeeWithOnboarding = async (req: Request, res: Response) => {
    try {
      // Handle both camelCase and snake_case parameter names
      const {
        firstName,
        lastName,
        email,
        phone,
        department,
        position,
        hireDate,
        hire_date,
        salary,
        annual_salary,
        assignedMentorId,
        assigned_mentor_id,
        createAccount,
        create_account,
        password,
        start_date,
      } = req.body;

      const currentUserId = (req as any).user?._id;
      const currentUserRole = (req as any).user?.role;

      // Resolve parameters (support both camelCase and snake_case)
      const shouldCreateAccount = createAccount !== false && create_account !== false;
      const hireDateValue = hireDate || hire_date || start_date || new Date();
      const salaryValue = salary || annual_salary || 0;
      const mentorId = assignedMentorId || assigned_mentor_id || null;
      const passwordValue = password || 'Welcome123!';

      // Verify authorization
      if (currentUserRole !== 'owner' && currentUserRole !== 'admin' && currentUserRole !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'Only owners, admins, and authenticated users can create employees',
        });
      }

      // Check for existing employee
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this email already exists',
        });
      }

      // Generate employee ID (DO NOT allow null/undefined to hit the unique index)
      const count = await Employee.countDocuments();
      const employeeId = `EMP${String(count + 1).padStart(4, '0')}${Math.floor(Math.random() * 1000)}`;
      // Use schema-required employeeCode field
      const employeeCode = employeeId;

      if (!employeeId) {
        throw new Error('employeeId generation failed');
      }


      // Initialize onboarding steps (12-step pipeline)
      const onboardingSteps = [
        { stepNumber: 1, name: 'Pre-Hire Documentation', status: 'pending' },
        { stepNumber: 2, name: 'Background Check', status: 'pending' },
        { stepNumber: 3, name: 'IT Account Setup', status: 'pending' },
        { stepNumber: 4, name: 'Office Access Setup', status: 'pending' },
        { stepNumber: 5, name: 'Hardware Assignment', status: 'pending' },
        { stepNumber: 6, name: 'Payroll Setup', status: 'pending' },
        { stepNumber: 7, name: 'Benefits Enrollment', status: 'pending' },
        { stepNumber: 8, name: 'Policy Training', status: 'pending' },
        { stepNumber: 9, name: 'System Access & Tools', status: 'pending' },
        { stepNumber: 10, name: 'First Day Orientation', status: 'pending' },
        { stepNumber: 11, name: 'Team Introductions', status: 'pending' },
        { stepNumber: 12, name: 'Goal Setting & Documentation', status: 'pending' },
      ];

      // ========== CRITICAL FIX: CREATE USER ACCOUNT FIRST ==========
      let userId = null;
      let userAccountInfo: any = null;

      if (shouldCreateAccount && email) {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (!existingUser) {
          // Don't hash password here - User model's pre-save hook will do it
          const userAccount = await User.create({
            email,
            password: passwordValue, // Pass plain text - pre-save hook will hash it
            role: 'user',
            firstName,
            lastName
          });
          userId = userAccount._id;
          userAccountInfo = { email: userAccount.email, role: userAccount.role, id: userAccount._id };
          console.log(`? Created user account for: ${email}`);
        } else {
          // Link existing user to employee
          userId = existingUser._id;
          userAccountInfo = { email: existingUser.email, role: existingUser.role, id: existingUser._id };
          console.log(`? Linked existing user to employee: ${email}`);
        }
      }
      // ========================================================

      // 2. Create employee with onboarding
      // Map to schema-required fields
      const employee = await Employee.create({
        employeeCode: employeeId,
        employeeId,
        firstName,
        lastName,
        email,

        // Required by current schema validations
        phone: phone || 'N/A',
        startDate: new Date(hireDateValue),
        salary: salaryValue,
        status: 'active',

        // Banking fields are required by schema (use safe defaults)
        bankName: req.body.bankName || 'N/A',
        bankAccountNumber: req.body.bankAccountNumber || 'N/A',
        bankBranchCode: req.body.bankBranchCode || 'N/A',
        taxReferenceNumber: req.body.taxReferenceNumber || 'N/A',
        uifReferenceNumber: req.body.uifReferenceNumber || 'N/A',

        department: department || 'General',
        position: position || 'Employee',
        userId,
        ownerId: (req as any).user?.ownerId || (req as any).user?._id,
        createdBy: currentUserId,

        // Onboarding
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

        // Probation
        isOnProbation: true,
        probationStartDate: new Date(),
        probationEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 days
        probationStatus: 'active',

        // Manager flags / defaults
        isManager: false,
      });

      // Update user with employeeId reference if user was created/linked
      if (userId) {
        await User.findByIdAndUpdate(userId, { employeeId: employee._id });
      }

      console.log(`Employee ${firstName} ${lastName} created with onboarding workflow started. User account linked: ${!!userId}`);

      res.status(201).json({
        success: true,
        message: `Employee ${firstName} ${lastName} created and onboarding started`,
        data: {
          ...employee.toObject(),
          userAccount: userAccountInfo
        }
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

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Calculate onboarding progress percentage
      const totalSteps = (employee as any).onboardingSteps?.length || 12;
      const completedSteps = (employee as any).onboardingSteps?.filter((s: any) => s.status === 'completed').length || 0;
      const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;


      // Get pending steps (top 3)
      const pendingSteps = (employee as any).onboardingSteps
        ?.filter((s: any) => s.status === 'pending')
        .slice(0, 3) || [];


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

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Find and update the specific step
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

      // Recalculate progress
      const totalSteps = employee.onboardingSteps?.length || 12;
      const completedSteps = employee.onboardingSteps?.filter(s => s.status === 'completed').length || 0;
      employee.onboardingProgress = Math.round((completedSteps / totalSteps) * 100);

      // Check if all steps are complete
      if (completedSteps === totalSteps) {
        employee.onboardingStatus = 'completed';
        employee.onboardingCompletedDate = new Date();
      }

      await employee.save();

      console.log(`Step ${stepNumber} updated for employee ${employee.firstName} ${employee.lastName}`);

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
      const completedBy = (req as any).user?._id;

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      if (!employee.isOnProbation) {
        return res.status(400).json({
          success: false,
          message: 'Employee is not on probation',
        });
      }

      // Update probation status
      employee.isOnProbation = false;
      employee.probationStatus = 'completed';
      employee.probationReviewDates = employee.probationReviewDates || [];
      employee.probationReviewDates.push(new Date());

      await employee.save();

      console.log(`Probation completed for employee ${employee.firstName} ${employee.lastName}`);

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

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Update checklist items
      if (employee.firstDayChecklist) {
        if (hardwareReceived !== undefined) employee.firstDayChecklist.hardwareReceived = hardwareReceived;
        if (softwareAccess !== undefined) employee.firstDayChecklist.softwareAccess = softwareAccess;
        if (badgeReceived !== undefined) employee.firstDayChecklist.badgeReceived = badgeReceived;
        if (deskAssigned !== undefined) employee.firstDayChecklist.deskAssigned = deskAssigned;
        if (orientationCompleted !== undefined) employee.firstDayChecklist.orientationCompleted = orientationCompleted;
      }

      // Check if all checklist items are complete
      const checklist = employee.firstDayChecklist;
      const allComplete =
        checklist?.hardwareReceived &&
        checklist?.softwareAccess &&
        checklist?.badgeReceived &&
        checklist?.deskAssigned &&
        checklist?.orientationCompleted;

      await employee.save();

      console.log(`First day checklist updated for employee ${employee.firstName} ${employee.lastName}`);

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
