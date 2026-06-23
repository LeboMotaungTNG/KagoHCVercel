import mongoose from 'mongoose';

/**
 * Onboarding Utility Functions
 * Provides helper functions for employee onboarding workflows
 */

/**
 * Get default 12-step onboarding workflow
 */
export const getDefaultOnboardingSteps = () => {
  return [
    { stepNumber: 1, name: 'Pre-Hire Documentation', status: 'pending' as const },
    { stepNumber: 2, name: 'Background Check', status: 'pending' as const },
    { stepNumber: 3, name: 'IT Account Setup', status: 'pending' as const },
    { stepNumber: 4, name: 'Office Access Setup', status: 'pending' as const },
    { stepNumber: 5, name: 'Hardware Assignment', status: 'pending' as const },
    { stepNumber: 6, name: 'Payroll Setup', status: 'pending' as const },
    { stepNumber: 7, name: 'Benefits Enrollment', status: 'pending' as const },
    { stepNumber: 8, name: 'Policy Training', status: 'pending' as const },
    { stepNumber: 9, name: 'System Access & Tools', status: 'pending' as const },
    { stepNumber: 10, name: 'First Day Orientation', status: 'pending' as const },
    { stepNumber: 11, name: 'Team Introductions', status: 'pending' as const },
    { stepNumber: 12, name: 'Goal Setting & Documentation', status: 'pending' as const },
  ];
};

/**
 * Calculate onboarding progress percentage
 */
export const calculateOnboardingProgress = (onboardingSteps: any[] = []): number => {
  if (!onboardingSteps || onboardingSteps.length === 0) return 0;
  
  const totalSteps = onboardingSteps.length;
  const completedSteps = onboardingSteps.filter(step => step.status === 'completed').length;
  
  return Math.round((completedSteps / totalSteps) * 100);
};

/**
 * Get next pending onboarding steps (default: top 3)
 */
export const getNextPendingSteps = (onboardingSteps: any[] = [], limit: number = 3) => {
  return onboardingSteps
    ?.filter(step => step.status === 'pending')
    .slice(0, limit)
    .map(step => ({
      stepNumber: step.stepNumber,
      name: step.name,
      status: step.status,
    })) || [];
};

/**
 * Calculate days remaining in probation period
 */
export const calculateProbationDaysRemaining = (probationEndDate: Date | null): number | null => {
  if (!probationEndDate) return null;
  
  const endDate = new Date(probationEndDate).getTime();
  const today = Date.now();
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  
  return daysRemaining > 0 ? daysRemaining : 0;
};

/**
 * Check if probation period is expired
 */
export const isProbationExpired = (probationEndDate: Date | null): boolean => {
  if (!probationEndDate) return false;
  return new Date(probationEndDate) < new Date();
};

/**
 * Calculate onboarding start to first day (days elapsed)
 */
export const calculateOnboardingDaysElapsed = (onboardingStartDate: Date | null): number => {
  if (!onboardingStartDate) return 0;
  
  const startDate = new Date(onboardingStartDate).getTime();
  const today = Date.now();
  const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  return daysElapsed;
};

/**
 * Get onboarding status badge color/category
 */
export const getOnboardingStatusCategory = (onboardingStatus: string, progress: number): string => {
  if (onboardingStatus === 'completed') return 'success';
  if (onboardingStatus === 'paused') return 'warning';
  if (progress >= 50) return 'in-progress';
  if (progress >= 25) return 'early-stage';
  return 'not-started';
};

/**
 * Get probation status badge color/category
 */
export const getProbationStatusCategory = (probationStatus: string): string => {
  switch (probationStatus) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'extended':
      return 'warning';
    case 'active':
      return 'in-progress';
    case 'pending':
    default:
      return 'pending';
  }
};

/**
 * Initialize first day checklist (all items unchecked)
 */
export const initializeFirstDayChecklist = () => {
  return {
    hardwareReceived: false,
    softwareAccess: false,
    badgeReceived: false,
    deskAssigned: false,
    orientationCompleted: false,
  };
};

/**
 * Calculate first day checklist completion percentage
 */
export const calculateChecklistProgress = (checklist: any = {}): number => {
  if (!checklist) return 0;
  
  const items = [
    checklist.hardwareReceived,
    checklist.softwareAccess,
    checklist.badgeReceived,
    checklist.deskAssigned,
    checklist.orientationCompleted,
  ];
  
  const completedItems = items.filter(item => item === true).length;
  return Math.round((completedItems / items.length) * 100);
};

/**
 * Check if all first day checklist items are complete
 */
export const isFirstDayChecklistComplete = (checklist: any = {}): boolean => {
  return (
    checklist.hardwareReceived === true &&
    checklist.softwareAccess === true &&
    checklist.badgeReceived === true &&
    checklist.deskAssigned === true &&
    checklist.orientationCompleted === true
  );
};

/**
 * Get probation extension deadline (typically 30 days)
 */
export const calculateProbationExtensionDeadline = (extensionDays: number = 30): Date => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + extensionDays);
  return deadline;
};

/**
 * Validate onboarding step data
 */
export const validateOnboardingStepUpdate = (stepNumber: number, status: string, totalSteps: number = 12): { valid: boolean; error?: string } => {
  // Validate step number
  if (stepNumber < 1 || stepNumber > totalSteps) {
    return { valid: false, error: `Step number must be between 1 and ${totalSteps}` };
  }

  // Validate status
  const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
  if (!validStatuses.includes(status)) {
    return { valid: false, error: `Status must be one of: ${validStatuses.join(', ')}` };
  }

  return { valid: true };
};

/**
 * Format onboarding summary for reporting
 */
export const formatOnboardingSummary = (employee: any) => {
  const progress = calculateOnboardingProgress(employee.onboardingSteps);
  const daysElapsed = calculateOnboardingDaysElapsed(employee.onboardingStartDate);
  const checklistProgress = calculateChecklistProgress(employee.firstDayChecklist);
  
  return {
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeEmail: employee.email,
    onboardingStatus: employee.onboardingStatus,
    onboardingProgress: progress,
    daysInOnboarding: daysElapsed,
    probationStatus: employee.probationStatus,
    probationDaysRemaining: calculateProbationDaysRemaining(employee.probationEndDate),
    checklistProgress,
    mentor: employee.assignedMentorId ? 'Assigned' : 'Not assigned',
    lastUpdateDate: employee.updatedAt,
  };
};

/**
 * Get onboarding milestones (key dates)
 */
export const getOnboardingMilestones = (employee: any) => {
  const milestones = [];

  if (employee.onboardingStartDate) {
    milestones.push({
      date: employee.onboardingStartDate,
      event: 'Onboarding Started',
      type: 'start',
    });
  }

  if (employee.hireDate) {
    milestones.push({
      date: employee.hireDate,
      event: 'Official Start Date',
      type: 'hire-date',
    });
  }

  if (employee.probationEndDate) {
    milestones.push({
      date: employee.probationEndDate,
      event: 'Probation End Date',
      type: 'probation-end',
    });
  }

  if (employee.onboardingCompletedDate) {
    milestones.push({
      date: employee.onboardingCompletedDate,
      event: 'Onboarding Completed',
      type: 'completion',
    });
  }

  // Sort by date
  return milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
