import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model';
import Company from '../company/models/Company';

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      console.log('Login attempt for:', email);
      
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Use bcryptjs.compareSync for simplicity
      const isValid = bcrypt.compareSync(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      
      res.json({ 
        success: true, 
        data: { 
          token, 
          user: { 
            id: user._id, 
            email: user.email, 
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          } 
        } 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getMe: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Public registration - creates regular users (employees) or owners
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;
      
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
      
      // Create user - FIX: Pass plain password, pre-save hook will hash it
      const user = await User.create({
        email,
        password,  // Plain text — User model's pre-save hook will hash it
        firstName,
        lastName,
        phone: phone || '',
        role: role === 'owner' ? 'owner' : 'user',  // Allow owner role to be set
        ownerId: null,  // Will be set after creation for owners
      });
      
      // If this is an owner, set ownerId to their own ID
      if (user.role === 'owner') {
        user.ownerId = user._id;
        await user.save();
      }
      
      // Create company record for owner
      if (user.role === 'owner') {
        await Company.create({
          ownerId: user._id,
          name: `${firstName}'s Company`,
          status: 'Active',
          verified: false
        });
      }
      
      // Generate token
      const token = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      
      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          }
        },
        message: 'User registered successfully'
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Admin/Owner only registration - can create managers or admins
  registerAdmin: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      // Only allow creating 'admin' or 'manager' roles, not 'owner'
      const allowedRoles = ['admin', 'manager'];
      if (role && !allowedRoles.includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid role. Can only create: ${allowedRoles.join(', ')}` 
        });
      }
      
      const existing = await User.findOne({ email }).select("+password");
      if (existing) {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: role || 'admin'  // Default to 'admin' if not specified
      });
      
      // Generate token
      const token = jwt.sign(
        { _id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          token
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  refreshToken: async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Refresh token endpoint' });
  },
  
  logout: async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out' });
  }
};

