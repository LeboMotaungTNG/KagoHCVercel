import { Request, Response } from 'express';
import { Role } from '../models/Role.model';

export const roleController = {
  // Get all roles for current owner
  getAll: async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user?._id;
      const roles = await Role.find({ ownerId }).sort({ name: 1 });
      res.json({ success: true, data: roles });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single role
  getById: async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user?._id;
      const role = await Role.findOne({ _id: req.params.id, ownerId });
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
      const ownerId = (req as any).user?._id;
      const createdBy = ownerId;

      const existingRole = await Role.findOne({ name, ownerId });
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
        ownerId,
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
      const ownerId = (req as any).user?._id;
      const role = await Role.findOneAndUpdate(
        { _id: req.params.id, ownerId },
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
      const ownerId = (req as any).user?._id;
      const role = await Role.findOneAndDelete({ _id: req.params.id, ownerId });
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
      res.json({ success: true, message: 'Role deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
