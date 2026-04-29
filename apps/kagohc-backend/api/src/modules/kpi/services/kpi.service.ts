import KpiTemplate, { IKpiTemplate } from '../models/KpiTemplate';
import KpiAssessment, { IKpiAssessment } from '../models/KpiAssessment';
import { KpiPeriod } from '../models/KpiPeriod';
import { Types } from 'mongoose';

export class KpiService {
  // Template Management
  async createTemplate(templateData: Partial<IKpiTemplate>, userId: string): Promise<IKpiTemplate> {
    // Validate weights sum to 100
    const totalWeight = templateData.metrics?.reduce((sum, m) => sum + m.weight, 0) || 0;
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Metric weights must sum to 100%');
    }

    const template = await KpiTemplate.create({
      ...templateData,
      createdBy: userId
    });
    return template;
  }

  async getTemplates(filters: any = {}): Promise<IKpiTemplate[]> {
    return KpiTemplate.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .sort('-createdAt')
      .lean() as Promise<IKpiTemplate[]>;
  }

  async getTemplateById(id: string): Promise<IKpiTemplate | null> {
    return KpiTemplate.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .lean() as Promise<IKpiTemplate | null>;
  }

  async updateTemplate(id: string, updates: Partial<IKpiTemplate>): Promise<IKpiTemplate | null> {
    if (updates.metrics) {
      const totalWeight = updates.metrics.reduce((sum, m) => sum + m.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        throw new Error('Metric weights must sum to 100%');
      }
    }

    return KpiTemplate.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
  }

  // Assessment Management
  async createAssessment(assessmentData: Partial<IKpiAssessment>, userId: string): Promise<IKpiAssessment> {
    // Check if assessment already exists for this period
    const existing = await KpiAssessment.findOne({
      employeeId: assessmentData.employeeId,
      'period.startDate': assessmentData.period?.startDate,
      'period.endDate': assessmentData.period?.endDate
    });

    if (existing) {
      throw new Error('Assessment already exists for this period');
    }

    const assessment = await KpiAssessment.create({
      ...assessmentData,
      createdBy: userId,
      status: 'draft'
    });

    return assessment.populate(['employeeId', 'templateId']);
  }

  async getEmployeeAssessments(employeeId: string): Promise<IKpiAssessment[]> {
    return KpiAssessment.find({ employeeId })
      .populate('templateId')
      .populate('employeeId', 'firstName lastName email')
      .sort('-period.startDate')
      .lean() as Promise<IKpiAssessment[]>;
  }

  async getPendingAssessments(managerId: string): Promise<IKpiAssessment[]> {
    // Get assessments for employees under this manager
    // This assumes you have a way to get team members
    return KpiAssessment.find({ 
      status: 'submitted'
    }).populate('employeeId', 'firstName lastName email department')
      .lean() as Promise<IKpiAssessment[]>;
  }

  async submitSelfAssessment(
    assessmentId: string, 
    selfAssessment: any
  ): Promise<IKpiAssessment | null> {
    const assessment = await KpiAssessment.findById(assessmentId);
    
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.status !== 'draft') {
      throw new Error('Assessment cannot be submitted');
    }

    assessment.selfAssessment = selfAssessment;
    assessment.status = 'submitted';
    assessment.selfAssessment.submittedAt = new Date();

    await assessment.save();
    return assessment.populate(['employeeId', 'templateId']);
  }

  async reviewAssessment(
    assessmentId: string,
    managerAssessment: any,
    finalScore: number
  ): Promise<IKpiAssessment | null> {
    const assessment = await KpiAssessment.findById(assessmentId);
    
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.status !== 'submitted') {
      throw new Error('Assessment is not ready for review');
    }

    assessment.managerAssessment = managerAssessment;
    assessment.finalScore = finalScore;
    assessment.status = 'reviewed';
    assessment.managerAssessment.reviewedAt = new Date();

    await assessment.save();
    return assessment.populate(['employeeId', 'templateId']);
  }

  async approveAssessment(assessmentId: string): Promise<IKpiAssessment | null> {
    const assessment = await KpiAssessment.findById(assessmentId);
    
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    if (assessment.status !== 'reviewed') {
      throw new Error('Assessment cannot be approved');
    }

    assessment.status = 'approved';
    await assessment.save();
    return assessment;
  }

  // Analytics
  async getEmployeeKpiHistory(employeeId: string, limit: number = 12): Promise<IKpiAssessment[]> {
    return KpiAssessment.find({ 
      employeeId,
      status: 'approved'
    })
    .populate('templateId')
    .sort('-period.endDate')
    .limit(limit)
    .select('period finalScore selfAssessment.achieved managerAssessment.overallRating')
    .lean() as Promise<IKpiAssessment[]>;
  }

  async getDepartmentAverages(department: string, period: any) {
    // Get average scores by department
    // This is a more complex aggregation
    const results = await KpiAssessment.aggregate([
      {
        $match: {
          'period.startDate': { $gte: period.startDate },
          'period.endDate': { $lte: period.endDate },
          status: 'approved'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $match: {
          'employee.department': department
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$finalScore' },
          totalAssessments: { $sum: 1 }
        }
      }
    ]);

    return results[0] || { averageScore: 0, totalAssessments: 0 };
  }

  // Period Management
  /**
   * Create a new KPI period (open/close window)
   */
  async createPeriod(data: any, userId: string) {
    // Calculate initial status based on dates
    const now = new Date();
    let status = 'upcoming';
    const reviewEnd = data.reviewEndDate || data.reviewDate;
    
    if (now >= data.openDate && now <= data.closeDate) {
      status = 'open';
    } else if (reviewEnd && now > data.closeDate && now <= reviewEnd) {
      status = 'review';
    } else if (reviewEnd && now > reviewEnd) {
      status = 'closed';
    }
    
    const period = await KpiPeriod.create({
      ...data,
      status,
      createdBy: userId
    });
    
    return period;
  }

  /**
   * Check if a period is open for submissions
   */
  async isPeriodOpen(periodId: string): Promise<boolean> {
    const period = await KpiPeriod.findById(periodId);
    if (!period) return false;
    
    const now = new Date();
    return now >= period.openDate && 
           now <= period.closeDate && 
           !period.isLocked;
  }

  /**
   * Submit assessment with period validation
   */
  async submitAssessment(assessmentId: string, employeeId: string) {
    const assessment = await KpiAssessment.findById(assessmentId)
      .populate('periodId');
    
    if (!assessment) {
      throw new Error('Assessment not found');
    }
    
    // Check if period is open
    const isOpen = await this.isPeriodOpen(assessment.periodId._id.toString());
    if (!isOpen) {
      throw new Error('Cannot submit: KPI period is closed');
    }
    
    // Check ownership
    if (assessment.employeeId.toString() !== employeeId) {
      throw new Error('Not authorized');
    }
    
    assessment.status = 'submitted';
    assessment.submittedAt = new Date();
    await assessment.save();
    
    return assessment;
  }

  /**
   * Lock a period after deadline
   */
  async lockPeriod(periodId: string, userId: string) {
    const period = await KpiPeriod.findById(periodId);
    if (!period) {
      throw new Error('Period not found');
    }
    
    period.isLocked = true;
    period.lockedAt = new Date();
    period.lockedBy = new Types.ObjectId(userId);
    period.status = 'closed';
    await period.save();
    
    // Lock all assessments in this period
    await KpiAssessment.updateMany(
      { periodId },
      { 
        status: 'locked',
        lockedAt: new Date()
      }
    );
    
    return period;
  }

  /**
   * Auto-update period statuses (run daily)
   */
  async updatePeriodStatuses() {
    const periods = await KpiPeriod.find({
      status: { $ne: 'archived' }
    });
    
    const now = new Date();
    let updated = 0;
    
    for (const period of periods) {
      let newStatus = period.status;
      const reviewEnd = (period as any).reviewEndDate || (period as any).reviewDate;
      
      if (now < period.openDate) {
        newStatus = 'upcoming';
      } else if (now >= period.openDate && now <= period.closeDate) {
        newStatus = 'open';
      } else if (reviewEnd && now > period.closeDate && now <= reviewEnd) {
        newStatus = 'review';
      } else if (reviewEnd && now > reviewEnd && !period.isLocked) {
        newStatus = 'closed';
        // Auto-lock if past review date
        await this.lockPeriod(period._id.toString(), 'system');
      }
      
      if (newStatus !== period.status) {
        period.status = newStatus;
        await period.save();
        updated++;
      }
    }
    
    return { updated };
  }

  /**
   * Get all periods
   */
  async getPeriods(filters: any = {}) {
    return KpiPeriod.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .populate('lockedBy', 'firstName lastName email')
      .sort('-createdAt')
      .lean();
  }

  /**
   * Get period by ID
   */
  async getPeriodById(id: string) {
    return KpiPeriod.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('lockedBy', 'firstName lastName email')
      .lean();
  }

  /**
   * Update period
   */
  async updatePeriod(id: string, updates: any) {
    return KpiPeriod.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Check if submission is allowed for this period
   */
  async canSubmitAssessment(periodId: string): Promise<{
    allowed: boolean;
    reason?: string;
    status?: string;
  }> {
    const period = await KpiPeriod.findById(periodId);
    if (!period) {
      return { allowed: false, reason: 'Period not found' };
    }
    
    const now = new Date();
    
    if (period.isLocked) {
      return { allowed: false, reason: 'Period is locked', status: period.status };
    }
    
    if (now < period.openDate) {
      return { 
        allowed: false, 
        reason: `Submissions open on ${period.openDate.toLocaleDateString()}`,
        status: period.status 
      };
    }
    
    if (now > period.closeDate) {
      return { 
        allowed: false, 
        reason: 'Submission deadline has passed',
        status: period.status 
      };
    }
    
    return { allowed: true, status: period.status };
  }

  /**
   * Check if manager review is allowed
   */
  async canReviewAssessment(periodId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const period = await KpiPeriod.findById(periodId);
    if (!period) {
      return { allowed: false, reason: 'Period not found' };
    }
    
    const now = new Date();
    const reviewStartDate = (period as any).reviewStartDate || period.closeDate;
    const reviewEndDate = (period as any).reviewEndDate || period.reviewDate;
    
    if (now < reviewStartDate) {
      return { 
        allowed: false, 
        reason: `Reviews start on ${new Date(reviewStartDate).toLocaleDateString()}`
      };
    }
    
    if (now > reviewEndDate) {
      return { 
        allowed: false, 
        reason: 'Review deadline has passed'
      };
    }
    
    return { allowed: true };
  }

  /**
   * Auto-lock periods after deadlines
   */
  async processPeriodLocks() {
    const now = new Date();
    const reviewEndDate = (this as any).reviewEndDate;
    
    // Find periods where review end date has passed and not locked
    const periods = await KpiPeriod.find({
      $expr: {
        $lt: [
          { $ifNull: ['$reviewEndDate', '$reviewDate'] },
          now
        ]
      },
      isLocked: false
    });
    
    for (const period of periods) {
      period.isLocked = true;
      period.status = 'closed';
      await period.save();
      
      // Lock assessments that are still in draft or submitted status
      await KpiAssessment.updateMany(
        { 
          periodId: period._id,
          status: { $in: ['draft', 'submitted'] }
        },
        { 
          status: 'locked',
          lockedAt: new Date()
        }
      );
    }
    
    return periods.length;
  }
}
