import { Request, Response } from 'express';
import { Role } from '../models/role.model';

export const roleController = {
  // Get all roles
  getAll: async (req: Request, res: Response) => {
    try {
      const companyId = (req as any).user?.companyId || (req as any).user?._id;
      const roles = await Role.find({ 
        $or: [{ companyId }, { companyId: null }] 
      }).sort({ name: 1 });
      res.json({ success: true, data: roles });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single role
  getById: async (req: Request, res: Response) => {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
      res.json({ success: true, data: role });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Create role
  create: async (req: Request, res: Response) => {
    try {
      const { name, description, level, department, minSalary, maxSalary } = req.body;
      const createdBy = (req as any).user?._id;
      const companyId = (req as any).user?.companyId || createdBy;

      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ success: false, message: 'Role already exists' });
      }

      const role = await Role.create({
        name,
        description,
        level,
        department,
        minSalary,
        maxSalary,
        companyId,
        createdBy
      });

      res.status(201).json({ success: true, data: role });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update role
  update: async (req: Request, res: Response) => {
    try {
      const role = await Role.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
      res.json({ success: true, data: role });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete role
  delete: async (req: Request, res: Response) => {
    try {
      const role = await Role.findByIdAndDelete(req.params.id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
      res.json({ success: true, message: 'Role deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
