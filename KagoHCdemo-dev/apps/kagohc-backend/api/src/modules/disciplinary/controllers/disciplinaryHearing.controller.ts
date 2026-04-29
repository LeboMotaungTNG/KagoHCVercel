import { Request, Response } from 'express';
import { DisciplinaryService } from '../services/disciplinary.service';

const disciplinaryService = new DisciplinaryService();

export class DisciplinaryHearingController {
  
  static async scheduleHearing(req: Request, res: Response) {
    try {
      const hearingData = req.body;
      const userId = (req as any).user?.id;
      
      const hearing = await disciplinaryService.scheduleHearing(hearingData, userId);
      
      res.status(201).json({
        success: true,
        data: hearing,
        message: 'Hearing scheduled successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateHearing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = (req as any).user?.id;
      
      // Add update logic here
      res.json({
        success: true,
        message: 'Hearing updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
