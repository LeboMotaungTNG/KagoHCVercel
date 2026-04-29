import { Request, Response } from 'express';
import { DisciplinaryService } from '../services/disciplinary.service';

const disciplinaryService = new DisciplinaryService();

export class DisciplinaryIncidentController {
  
  static async reportIncident(req: Request, res: Response) {
    try {
      const incidentData = req.body;
      const userId = (req as any).user?.id;
      
      const incident = await disciplinaryService.reportIncident(incidentData, userId);
      
      res.status(201).json({
        success: true,
        data: incident,
        message: 'Incident reported successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getIncidents(req: Request, res: Response) {
    try {
      // Add get incidents logic here
      res.json({
        success: true,
        data: []
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
