import { Request, Response } from 'express';
import { KpiService } from '../services/kpi.service';
import KpiAssessment from '../models/KpiAssessment';
import { KpiPeriod } from '../models/KpiPeriod';

const kpiService = new KpiService();

export const kpiController = {
  // Template endpoints
  async createTemplate(req: Request, res: Response) {
    try {
      const template = await kpiService.createTemplate(req.body, req.user._id);
      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async getTemplates(req: Request, res: Response) {
    try {
      const filters: any = {};
      if (req.query.department) filters.department = req.query.department;
      if (req.query.category) filters.category = req.query.category;
      if (req.query.isActive) filters.isActive = req.query.isActive === 'true';

      const templates = await kpiService.getTemplates(filters);
      res.json({
        success: true,
        data: templates
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getTemplateById(req: Request, res: Response) {
    try {
      const template = await kpiService.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      res.json({
        success: true,
        data: template
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async updateTemplate(req: Request, res: Response) {
    try {
      const template = await kpiService.updateTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      res.json({
        success: true,
        data: template
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Assessment endpoints
  async createAssessment(req: Request, res: Response) {
    try {
      const assessment = await kpiService.createAssessment(req.body, req.user._id);
      res.status(201).json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async getMyAssessments(req: Request, res: Response) {
    try {
      const assessments = await kpiService.getEmployeeAssessments(req.user._id);
      res.json({
        success: true,
        data: assessments
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getEmployeeAssessments(req: Request, res: Response) {
    try {
      // Check if user is manager or admin
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const assessments = await kpiService.getEmployeeAssessments(req.params.employeeId);
      res.json({
        success: true,
        data: assessments
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getPendingAssessments(req: Request, res: Response) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const assessments = await kpiService.getPendingAssessments(req.user._id);
      res.json({
        success: true,
        data: assessments
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async submitSelfAssessment(req: Request, res: Response) {
    try {
      const assessment = await kpiService.submitSelfAssessment(
        req.params.id,
        req.body.selfAssessment
      );
      res.json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async reviewAssessment(req: Request, res: Response) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const assessment = await kpiService.reviewAssessment(
        req.params.id,
        req.body.managerAssessment,
        req.body.finalScore
      );
      res.json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async approveAssessment(req: Request, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const assessment = await kpiService.approveAssessment(req.params.id);
      res.json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async getKpiHistory(req: Request, res: Response) {
    try {
      const history = await kpiService.getEmployeeKpiHistory(
        req.params.employeeId || req.user._id,
        Number(req.query.limit) || 12
      );
      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getDepartmentStats(req: Request, res: Response) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const period = {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string)
      };

      const stats = await kpiService.getDepartmentAverages(
        req.query.department as string,
        period
      );
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Period Management endpoints
  async createPeriod(req: Request, res: Response) {
    try {
      const period = await kpiService.createPeriod(req.body, req.user._id);
      res.status(201).json({ 
        success: true, 
        data: period 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async getPeriods(req: Request, res: Response) {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.type) filters.type = req.query.type;

      const periods = await kpiService.getPeriods(filters);
      res.json({
        success: true,
        data: periods
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getPeriodById(req: Request, res: Response) {
    try {
      const period = await kpiService.getPeriodById(req.params.id);
      if (!period) {
        return res.status(404).json({
          success: false,
          error: 'Period not found'
        });
      }
      res.json({
        success: true,
        data: period
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async updatePeriod(req: Request, res: Response) {
    try {
      const period = await kpiService.updatePeriod(req.params.id, req.body);
      if (!period) {
        return res.status(404).json({
          success: false,
          error: 'Period not found'
        });
      }
      res.json({
        success: true,
        data: period
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async lockPeriod(req: Request, res: Response) {
    try {
      const period = await kpiService.lockPeriod(req.params.id, req.user._id);
      res.json({ 
        success: true, 
        data: period,
        message: 'Period locked successfully' 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async submitAssessment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const assessment = await KpiAssessment.findById(id)
        .populate('periodId');
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }
      
      // Check if period allows submission
      const { allowed, reason } = await kpiService.canSubmitAssessment(
        assessment.periodId._id.toString()
      );
      
      if (!allowed) {
        return res.status(400).json({
          success: false,
          error: reason
        });
      }
      
      // Check ownership
      if (assessment.employeeId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }
      
      assessment.status = 'submitted';
      assessment.submittedAt = new Date();
      if (assessment.selfAssessment) {
        assessment.selfAssessment.submittedAt = new Date();
      }
      await assessment.save();
      
      res.json({
        success: true,
        data: assessment,
        message: 'Assessment submitted successfully'
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async getCurrentPeriod(req: Request, res: Response) {
    try {
      const now = new Date();
      const period = await KpiPeriod.findOne({
        openDate: { $lte: now },
        closeDate: { $gte: now },
        isLocked: false
      });
      
      res.json({
        success: true,
        data: period
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async checkPeriodStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const period = await kpiService.getPeriodById(id);
      
      if (!period) {
        return res.status(404).json({
          success: false,
          error: 'Period not found'
        });
      }
      
      const now = new Date();
      const canSubmit = now >= period.openDate && 
                        now <= period.closeDate && 
                        !period.isLocked;
      
      const reviewStartDate = (period as any).reviewStartDate || period.closeDate;
      const reviewEndDate = (period as any).reviewEndDate || period.reviewDate;
      const canReview = now >= reviewStartDate && 
                        now <= reviewEndDate;
      
      res.json({
        success: true,
        data: {
          period,
          canSubmit,
          canReview,
          daysUntilOpen: Math.ceil((new Date(period.openDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          daysUntilClose: Math.ceil((new Date(period.closeDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          daysUntilReviewEnd: Math.ceil((new Date(reviewEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async processPeriodLocks(req: Request, res: Response) {
    try {
      const locked = await kpiService.processPeriodLocks();
      res.json({
        success: true,
        data: { locked },
        message: `${locked} periods locked`
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  async updatePeriodStatuses(req: Request, res: Response) {
    try {
      const result = await kpiService.updatePeriodStatuses();
      res.json({
        success: true,
        data: result,
        message: `${result.updated} periods updated`
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
};
