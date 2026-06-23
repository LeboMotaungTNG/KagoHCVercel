import { LeaveModel, ILeave, LeaveStatus, LeaveType } from '../models/leave.model';
import { Employee } from '../../employee/models/employee.model';
import { LeavePolicyModel, BCEA_STATUTORY_DEFAULTS } from '../../owner/models/leave-policy.model';
import { Types } from 'mongoose';

export interface LeaveFilters {
  status?: LeaveStatus;
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  search?: string;
  employee_id?: string;
  page?: number;
  limit?: number;
}

export interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface LeaveTypeMeta {
  type: string;
  name: string;
  entitlementDays: number;
  icon?: string;
  color?: string;
  isStatutory?: boolean;
  enabled?: boolean;
}

export class LeaveService {

  // Pulls enabled leave types straight from the owner-managed LeavePolicyModel so
  // that any change made on the Owner → Organization → Statutory Leave tab is
  // reflected immediately for employees (entitlement days, toggled-off types, etc.).
  async getLeaveTypes(): Promise<LeaveTypeMeta[]> {
    // Seed BCEA statutory defaults the first time so employees always have the
    // standard leave types available even before an owner opens the settings page.
    const count = await LeavePolicyModel.countDocuments();
    if (count === 0) {
      await LeavePolicyModel.insertMany(BCEA_STATUTORY_DEFAULTS);
    }

    const policies = await LeavePolicyModel.find({ enabled: { $ne: false } })
      .sort({ isStatutory: -1, createdAt: 1 })
      .lean();

    return policies.map((p: any) => ({
      type: p.type,
      name: p.name,
      // Owner UI persists daysPerYear/daysTotal; fall back to entitlementDays
      // for legacy records seeded directly from BCEA defaults.
      entitlementDays: p.entitlementDays || p.daysPerYear || p.daysTotal || 0,
      icon: p.icon,
      color: p.color,
      isStatutory: !!p.isStatutory,
      enabled: p.enabled !== false,
    }));
  }
  
  async calculateTotalDays(startDate: Date, endDate: Date): Promise<number> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  async create(data: Partial<ILeave>, userId: string): Promise<ILeave> {
    // Calculate total days if not provided
    if (!data.total_days && data.start_date && data.end_date) {
      data.total_days = await this.calculateTotalDays(
        new Date(data.start_date), 
        new Date(data.end_date)
      );
    }
    
    const leave = await LeaveModel.create({
      ...data,
      submitted_at: new Date(),
      createdBy: userId,
      updatedBy: userId
    });
    return leave;
  }

  async findAll(filters: LeaveFilters = {}) {
    const query: any = {};
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.leave_type) {
      query.leave_type = filters.leave_type;
    }
    if (filters.employee_id) {
      query.employee_id = new Types.ObjectId(filters.employee_id);
    }
    if (filters.start_date) {
      query.start_date = { $gte: new Date(filters.start_date) };
    }
    if (filters.end_date) {
      query.end_date = { $lte: new Date(filters.end_date) };
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const [leaves, total] = await Promise.all([
      LeaveModel.find(query)
        .populate('employee_id', 'firstName lastName email employeeId')
        .populate('reviewed_by', 'email')
        .sort({ submitted_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveModel.countDocuments(query)
    ]);

    // Transform to match frontend expected format
    const transformedLeaves = leaves.map(leave => ({
      _id: leave._id.toString(),
      leave_id: leave.leave_id,
      full_name: leave.full_name,
      employee_code: leave.employee_code,
      department: leave.department,
      position: leave.position,
      leave_type: leave.leave_type,
      start_date: leave.start_date.toISOString().split('T')[0],
      end_date: leave.end_date.toISOString().split('T')[0],
      total_days: leave.total_days,
      reason: leave.reason,
      status: leave.status,
      submitted_at: leave.submitted_at.toISOString(),
      reviewed_by: leave.reviewed_by,
      reviewer_name: leave.reviewer_name,
      reviewed_at: leave.reviewed_at?.toISOString(),
      rejection_reason: leave.rejection_reason,
      attachment_path: leave.attachment_path
    }));

    return {
      data: transformedLeaves,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        pageSize: limit
      }
    };
  }

  async findById(id: string): Promise<ILeave | null> {
    return await LeaveModel.findById(id)
      .populate('employee_id')
      .populate('reviewed_by', 'email firstName lastName');
  }

  async findByLeaveId(leaveId: number): Promise<ILeave | null> {
    return await LeaveModel.findOne({ leave_id: leaveId })
      .populate('employee_id')
      .populate('reviewed_by', 'email firstName lastName');
  }

  async update(id: string, data: Partial<ILeave>, userId: string): Promise<ILeave | null> {
    // Recalculate days if dates changed
    if (data.start_date && data.end_date) {
      data.total_days = await this.calculateTotalDays(
        new Date(data.start_date), 
        new Date(data.end_date)
      );
    }
    
    return await LeaveModel.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await LeaveModel.findByIdAndDelete(id);
    return result !== null;
  }

  async approve(id: string, reviewerId: string, reviewerName: string): Promise<ILeave | null> {
    return await LeaveModel.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        reviewed_by: reviewerId,
        reviewer_name: reviewerName,
        reviewed_at: new Date(),
        updatedBy: reviewerId
      },
      { new: true }
    );
  }

  async reject(id: string, reviewerId: string, reviewerName: string, reason: string): Promise<ILeave | null> {
    return await LeaveModel.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: reviewerId,
        reviewer_name: reviewerName,
        reviewed_at: new Date(),
        updatedBy: reviewerId
      },
      { new: true }
    );
  }

  async cancel(id: string, userId: string): Promise<ILeave | null> {
    return await LeaveModel.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        updatedBy: userId
      },
      { new: true }
    );
  }

  async getStats(filters: LeaveFilters = {}): Promise<LeaveStats> {
    const query: any = {};
    
    if (filters.employee_id) {
      query.employee_id = new Types.ObjectId(filters.employee_id);
    }

    const stats = await LeaveModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result: LeaveStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id as keyof LeaveStats] = stat.count;
      result.total += stat.count;
    });

    return result;
  }

  async getEmployeeLeaveBalance(employeeId: string): Promise<any> {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const leaves = await LeaveModel.find({
      employee_id: employeeId,
      start_date: { $gte: startOfYear },
      end_date: { $lte: endOfYear },
      status: { $in: ['approved', 'pending'] }
    });

    // Calculate used days per leave type
    const used: Record<string, number> = {};
    leaves.forEach(leave => {
      used[leave.leave_type] = (used[leave.leave_type] || 0) + leave.total_days;
    });

    const balance: Record<string, { used: number; total: number; remaining: number }> = {};

    // Only return balances for currently-enabled policies so that toggling a
    // leave type off in Organization Settings hides it on the employee side.
    const activeTypes = await this.getLeaveTypes();
    activeTypes.forEach(({ type, entitlementDays }) => {
      const usedDays = used[type] || 0;
      balance[type] = {
        used: usedDays,
        total: entitlementDays,
        remaining: Math.max(0, entitlementDays - usedDays)
      };
    });

    return balance;
  }
}
