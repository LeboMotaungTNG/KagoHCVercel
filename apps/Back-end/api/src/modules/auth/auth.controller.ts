import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from './user.model';
import Company from '../company/models/Company';
import CompanyInvite from '../platform/models/CompanyInvite';

// ── ownerId is now included in every token so every downstream controller
// can filter by tenant without an extra DB lookup.
const signToken = (user: {
  _id: any;
  email: string;
  role: string;
  ownerId?: any;
}) =>
  jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      ownerId: user.ownerId ?? null,
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

const GENERIC_RESET_MESSAGE =
  'If an account exists for that email, we have sent password reset instructions.';

const buildResetUrl = (token: string) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/reset-password/${token}`;
};

export const authController = {
  // ── POST /auth/login ────────────────────────────────────────────────────────
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Select password AND ownerId — both are needed for the token
      const user = await User.findOne({ email }).select('+password +ownerId');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = signToken(user);

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            ownerId: user.ownerId,
          },
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // ── GET /auth/me ────────────────────────────────────────────────────────────
  getMe: async (req: Request, res: Response) => {
    try {
      const reqUser = (req as any).user;
      if (!reqUser) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      // Return full user from DB so ownerId and other fields are always fresh
      const user = await User.findById(reqUser._id).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({ success: true, data: user });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // ── POST /auth/register ─────────────────────────────────────────────────────
  // Public self-serve registration. Role is server-forced to 'owner'.
  // The client cannot supply platform_admin or any other role.
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone: phone || '',
        role: 'owner',
        ownerId: null, // set to self below
      });

      // Owner's ownerId === their own _id (root of their tenant)
      user.ownerId = user._id;
      await user.save();

      await Company.create({
        ownerId: user._id,
        name: `${firstName}'s Company`,
        status: 'Active',
        verified: false,
      });

      const token = signToken(user);

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            ownerId: user.ownerId,
          },
        },
        message: 'User registered successfully',
      });
    } catch (error: any) {
      console.error('Register error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // ── POST /auth/register-admin ───────────────────────────────────────────────
  // Owner or admin adds a new admin/manager to their own company.
  // ownerId is inherited from req.user — never from the request body.
  registerAdmin: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const requestingUser = (req as any).user;

      const allowedRoles = ['admin', 'manager'];
      if (role && !allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Can only create: ${allowedRoles.join(', ')}`,
        });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }

      // Resolve tenant root: owners have ownerId === _id;
      // admins/managers have ownerId pointing to their owner.
      const ownerId =
        requestingUser.role === 'owner'
          ? requestingUser._id
          : requestingUser.ownerId;

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: role || 'admin',
        ownerId,
      });

      const token = signToken(user);

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            ownerId: user.ownerId,
          },
          token,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // ── POST /auth/accept-invite ────────────────────────────────────────────────
  // Public — the invited owner sets their name + password here.
  // The invite token is the only credential; no JWT required.
  acceptInvite: async (req: Request, res: Response) => {
    try {
      const { token, firstName, lastName, password } = req.body;

      if (!token || !firstName || !lastName || !password) {
        return res.status(400).json({
          success: false,
          message: 'token, firstName, lastName and password are all required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      const invite = await CompanyInvite.findOne({ token });
      if (!invite) {
        return res.status(404).json({ success: false, message: 'Invalid invite link' });
      }
      if (invite.used) {
        return res.status(400).json({
          success: false,
          message: 'This invite link has already been used',
        });
      }
      if (new Date() > invite.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'This invite link has expired. Ask the platform admin to resend it.',
        });
      }

      const existingUser = await User.findOne({ email: invite.email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: `An account already exists for ${invite.email}`,
        });
      }

      // Create owner — ownerId set to self after creation
      const user = await User.create({
        email: invite.email,
        password,
        firstName,
        lastName,
        role: 'owner',
        ownerId: null,
      });

      user.ownerId = user._id;
      await user.save();

      // Link the pre-created company shell to this new owner
      await Company.findByIdAndUpdate(invite.companyId, {
        ownerId: user._id,
        status: 'Active',
      });

      invite.used = true;
      invite.usedAt = new Date();
      await invite.save();

      const jwtToken = signToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created. Welcome aboard!',
        data: {
          token: jwtToken,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            ownerId: user.ownerId,
          },
        },
      });
    } catch (error: any) {
      console.error('acceptInvite error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // ── POST /auth/refresh-token ────────────────────────────────────────────────
  refreshToken: async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Refresh token endpoint' });
  },

  // ── POST /auth/logout ───────────────────────────────────────────────────────
  logout: async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out' });
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const user = await User.findOne({ email });
      let resetUrl: string | undefined;

      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        resetUrl = buildResetUrl(resetToken);
        console.log(`[password-reset] Reset link for ${email}: ${resetUrl}`);
      }

      const payload: Record<string, unknown> = {
        success: true,
        message: GENERIC_RESET_MESSAGE,
      };

      if (process.env.NODE_ENV !== 'production' && resetUrl) {
        payload.resetUrl = resetUrl;
      }

      res.json(payload);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Reset token and new password are required',
        });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      }).select('+password');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Reset link is invalid or has expired',
        });
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
        });
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
