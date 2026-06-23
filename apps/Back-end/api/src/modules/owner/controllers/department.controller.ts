import { Request, Response } from 'express';
import { Department } from '../models/Department.model';

export const departmentController = {
  // Get all departments for current owner
  getAll: async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user?._id;
      const departments = await Department.find({ ownerId }).sort({ name: 1 });
      res.json({ success: true, data: departments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single department
  getById: async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user?._id;
      const department = await Department.findOne({ _id: req.params.id, ownerId });
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
      const ownerId = (req as any).user?._id;
      const createdBy = ownerId;

      const existingDepartment = await Department.findOne({ name, ownerId });
      if (existingDepartment) {
        return res.status(400).json({ success: false, message: 'Department already exists' });
      }

      const department = new Department({
        name,
        description,
        manager,
        parentDepartment,
        budget,
        ownerId,
        createdBy
      });

      await department.save();

      res.status(201).json({ success: true, data: department });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update department
  update: async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user?._id;
      const department = await Department.findOneAndUpdate(
        { _id: req.params.id, ownerId },
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
      const ownerId = (req as any).user?._id;
      const department = await Department.findOneAndDelete({ _id: req.params.id, ownerId });
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, message: 'Department deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
