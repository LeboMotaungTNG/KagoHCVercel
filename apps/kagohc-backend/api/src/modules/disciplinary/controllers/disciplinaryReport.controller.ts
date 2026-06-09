import { Request, Response } from 'express';
import { DisciplinaryService } from '../services/disciplinary.service';

const disciplinaryService = new DisciplinaryService();

export class DisciplinaryReportController {
  
  static async getSummaryReport(req: Request, res: Response) {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        category: req.query.category as string,
        severity: req.query.severity as string,
        status: req.query.status as string,
        department: req.query.department as string
      };
      
      const report = await disciplinaryService.getDisciplinaryReport(filters);
      
      res.json({
        success: true,
        data: report,
        message: 'Report generated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getTrendAnalysis(req: Request, res: Response) {
    try {
      const { year } = req.query;
      const trends = await disciplinaryService.getTrendAnalysis(parseInt(year as string));
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
