import { Request, Response } from 'express';
import { User } from '../auth/user.model';

export const usersController = {
    getAll: async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const currentUserRole = currentUser?.role;
      const currentUserId = currentUser?._id;
      
      let filter = {};
      
      // If user is owner, only show users they created or themselves
      if (currentUserRole === 'owner') {
        filter = { 
          $or: [
            { ownerId: currentUserId },
            { _id: currentUserId }
          ]
        };
      }
      
      const users = await User.find(filter).select('-password');
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getById: async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  update: async (req: Request, res: Response) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id, 
        { role: req.body.role },
        { new: true }
      ).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  delete: async (req: Request, res: Response) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, message: 'User deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

