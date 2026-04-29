import { Request, Response } from 'express';
import { DisciplinaryService } from '../services/disciplinary.service';

const disciplinaryService = new DisciplinaryService();

export class DisciplinaryAppealController {
  
  static async createAppeal(req: Request, res: Response) {
    try {
      const appealData = req.body;
      const userId = (req as any).user?.id;
      
      const appeal = await disciplinaryService.createAppeal(appealData, userId);
      
      res.status(201).json({
        success: true,
        data: appeal,
        message: 'Appeal filed successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async resolveAppeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { outcome, reason } = req.body;
      // Add resolve logic here
      res.json({
        success: true,
        message: 'Appeal resolved successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getAppeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Add get logic here
      res.json({
        success: true,
        data: null
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
