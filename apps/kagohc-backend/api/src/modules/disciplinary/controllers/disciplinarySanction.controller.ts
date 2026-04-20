import { Request, Response } from 'express';
import { DisciplinaryService } from '../services/disciplinary.service';

const disciplinaryService = new DisciplinaryService();

export class DisciplinarySanctionController {
  
  static async createSanction(req: Request, res: Response) {
    try {
      const sanctionData = req.body;
      const userId = (req as any).user?.id;
      
      const sanction = await disciplinaryService.createSanction(sanctionData, userId);
      
      res.status(201).json({
        success: true,
        data: sanction,
        message: 'Sanction issued successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateSanction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Add update logic here
      res.json({
        success: true,
        message: 'Sanction updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getSanction(req: Request, res: Response) {
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
