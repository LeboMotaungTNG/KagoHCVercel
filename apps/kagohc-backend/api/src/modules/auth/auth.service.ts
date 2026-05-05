import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from './user.model';  // THIS WAS MISSING!
import { AppError } from '../../core/errors/AppError';

export class AuthService {
  
  async register(userData: any) {
    try {
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError('User already exists', 400);
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await UserModel.create({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'user',
        isActive: true
      });

      const token = jwt.sign(
        {
          _id: user._id,
          userId: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      },
      token,
      refreshToken
    };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { 
        _id: user._id,
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      },
      token,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key') as any;
      
      const user = await UserModel.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      const token = jwt.sign(
        { 
          _id: user._id,
          userId: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return { token };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(refreshToken: string) {
    await UserModel.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: 1 } }
    );
  }

  async getProfile(userId: string) {
    const user = await UserModel.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateProfile(userId: string, updates: any) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { ...updates },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  async getManagers() {
    const managers = await UserModel.find({ role: 'manager' }).select('-password -refreshToken');
    return managers;
  }

  async checkExisting(email: string) {
    return await UserModel.findOne({ email });
  }

  async createManagerUser(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await UserModel.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      role: 'manager',
      isActive: true
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    };
  }
}

