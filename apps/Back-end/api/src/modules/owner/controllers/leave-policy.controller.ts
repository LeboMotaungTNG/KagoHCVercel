import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../../core/utils/response';
import { AppError } from '../../../core/errors/AppError';
import { LeavePolicyModel, BCEA_STATUTORY_DEFAULTS } from '../models/leave-policy.model';

const ADMIN_ROLES = ['owner', 'admin', 'hr'];

const ensureAdmin = (req: Request) => {
  const role = (req.user as any)?.role;
  if (!ADMIN_ROLES.includes(role)) {
    throw new AppError('You are not allowed to modify organization settings', 403);
  }
};

export class LeavePolicyController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?._id;
      const count = await LeavePolicyModel.countDocuments();
      if (count === 0) {
        await LeavePolicyModel.insertMany(
          BCEA_STATUTORY_DEFAULTS.map(p => ({ ...p, createdBy: userId, updatedBy: userId }))
        );
      }
      const policies = await LeavePolicyModel.find().sort({ isStatutory: -1, createdAt: 1 });
      successResponse(res, 200, 'Leave policies retrieved', policies);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      ensureAdmin(req);
      const userId = (req.user as any)?._id;
      if (!req.body?.type || !req.body?.name) {
        throw new AppError('Leave policy "type" and "name" are required', 400);
      }
      const policy = await LeavePolicyModel.create({
        ...req.body, createdBy: userId, updatedBy: userId,
      });
      successResponse(res, 201, 'Leave policy created', policy);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      ensureAdmin(req);
      const userId = (req.user as any)?._id;
      const policy = await LeavePolicyModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: userId },
        { new: true, runValidators: true }
      );
      if (!policy) throw new AppError('Leave policy not found', 404);
      successResponse(res, 200, 'Leave policy updated', policy);
    } catch (error) { next(error); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      ensureAdmin(req);
      const policy = await LeavePolicyModel.findByIdAndDelete(req.params.id);
      if (!policy) throw new AppError('Leave policy not found', 404);
      successResponse(res, 200, 'Leave policy deleted');
    } catch (error) { next(error); }
  }
}
