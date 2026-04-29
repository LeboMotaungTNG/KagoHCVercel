import { Request, Response } from 'express';
import { DisciplinaryService } from '../services/disciplinary.service';

const disciplinaryService = new DisciplinaryService();

export class DisciplinaryCaseController {
  
  static async createCase(req: Request, res: Response) {
    try {
      const caseData = req.body;
      const userId = (req as any).user?.id;
      
      const newCase = await disciplinaryService.createCase(caseData, userId);
      
      res.status(201).json({
        success: true,
        data: newCase,
        message: 'Disciplinary case created successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getCases(req: Request, res: Response) {
    try {
      const filters = {
        employeeId: req.query.employeeId as string,
        status: req.query.status as string,
        category: req.query.category as string,
        severity: req.query.severity as string
      };
      
      const cases = await disciplinaryService.getCases(filters);
      
      res.json({
        success: true,
        data: cases,
        count: cases.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getCaseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const disciplinaryCase = await disciplinaryService.getCaseById(id);
      
      res.json({
        success: true,
        data: disciplinaryCase
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateCase(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = (req as any).user?.id;
      
      const updatedCase = await disciplinaryService.updateCase(id, updateData, userId);
      
      res.json({
        success: true,
        data: updatedCase,
        message: 'Case updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getEmployeeHistory(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const history = await disciplinaryService.getEmployeeDisciplinaryHistory(employeeId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
