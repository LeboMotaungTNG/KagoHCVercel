import { LeaveModel, ILeave, LeaveStatus, LeaveType } from '../models/leave.model';
import { Employee } from '../../employee/models/employee.model';
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
  type: LeaveType;
  name: string;
  entitlementDays: number;
}

// Single source of truth for leave types, their display names and yearly entitlement.
// Used for both the leave-type dropdown and the balance calculation so they stay in sync.
export const LEAVE_TYPES: LeaveTypeMeta[] = [
  { type: 'annual', name: 'Annual Leave', entitlementDays: 20 },
  { type: 'sick', name: 'Sick Leave', entitlementDays: 10 },
  { type: 'family', name: 'Family Responsibility', entitlementDays: 5 },
  { type: 'maternity', name: 'Maternity Leave', entitlementDays: 120 },
  { type: 'paternity', name: 'Paternity Leave', entitlementDays: 10 },
  { type: 'study', name: 'Study Leave', entitlementDays: 15 },
  { type: 'unpaid', name: 'Unpaid Leave', entitlementDays: 0 },
  { type: 'other', name: 'Other', entitlementDays: 5 },
];

export class LeaveService {

  getLeaveTypes(): LeaveTypeMeta[] {
    return LEAVE_TYPES;
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

    LEAVE_TYPES.forEach(({ type, entitlementDays }) => {
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
