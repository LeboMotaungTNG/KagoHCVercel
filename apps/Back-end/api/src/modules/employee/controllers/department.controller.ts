import { Request, Response } from 'express';
import { Department } from '../models/department.model';

export const departmentController = {
  // Get all departments
  getAll: async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).user?.companyId || (req as any).user?._id;
      const departments = await Department.find({ 
        $or: [{ companyId }, { companyId: null }] 
      }).sort({ name: 1 });
      res.json({ success: true, data: departments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single department
  getById: async (req: Request, res: Response) => {
    try {
      const department = await Department.findById(req.params.id);
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, data: department });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Create department
  create: async (req: Request, res: Response) => {
    try {
      const { name, description, manager, parentDepartment, budget } = req.body;
      const createdBy = (req as any).user?._id;
      const companyId = (req as any).user?.companyId || createdBy;

      const existingDepartment = await Department.findOne({ name });
      if (existingDepartment) {
        return res.status(400).json({ success: false, message: 'Department already exists' });
      }

      const department = await Department.create({
        name,
        description,
        manager,
        parentDepartment,
        budget,
        companyId,
        createdBy
      });

      res.status(201).json({ success: true, data: department });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update department
  update: async (req: Request, res: Response) => {
    try {
      const department = await Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, data: department });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete department
  delete: async (req: Request, res: Response) => {
    try {
      const department = await Department.findByIdAndDelete(req.params.id);
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, message: 'Department deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
