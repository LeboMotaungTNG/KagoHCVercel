import mongoose, { Types } from 'mongoose';
import { LeaveRuleModel, ILeaveRule, ILeaveCycle } from '../models/leave-rules.model';
import { AppError } from '../../../core/errors/AppError';

export class LeaveRulesService {
  
  async getAll(filters: { is_active?: boolean; search?: string } = {}): Promise<ILeaveRule[]> {
    const query: any = {};
    
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    return LeaveRuleModel.find(query).sort({ name: 1 });
  }
  
  async findById(id: string): Promise<ILeaveRule | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave rule ID', 400);
    }
    return LeaveRuleModel.findById(id);
  }
  
  async findByName(name: string): Promise<ILeaveRule | null> {
    return LeaveRuleModel.findOne({ name });
  }
  
  async create(data: Partial<ILeaveRule>, userId: string): Promise<ILeaveRule> {
    // Check if rule with same name exists
    const existing = await LeaveRuleModel.findOne({ name: data.name });
    if (existing) {
      throw new AppError(`Leave rule '${data.name}' already exists`, 400);
    }
    
    const leaveRule = new LeaveRuleModel({
      ...data,
      created_by: new Types.ObjectId(userId),
      updated_by: new Types.ObjectId(userId)
    });
    
    await leaveRule.save();
    return leaveRule;
  }
  
  async update(id: string, data: Partial<ILeaveRule>, userId: string): Promise<ILeaveRule> {
    const leaveRule = await LeaveRuleModel.findById(id);
    if (!leaveRule) {
      throw new AppError('Leave rule not found', 404);
    }
    
    // Check for duplicate name (excluding current record)
    if (data.name && data.name !== leaveRule.name) {
      const existing = await LeaveRuleModel.findOne({ name: data.name, _id: { $ne: leaveRule._id } });
      if (existing) {
        throw new AppError(`Leave rule '${data.name}' already exists`, 400);
      }
    }
    
    Object.assign(leaveRule, data, { updated_by: new Types.ObjectId(userId) });
    await leaveRule.save();
    return leaveRule;
  }
  
  async delete(id: string): Promise<void> {
    const leaveRule = await LeaveRuleModel.findById(id);
    if (!leaveRule) {
      throw new AppError('Leave rule not found', 404);
    }
    
    await LeaveRuleModel.findByIdAndDelete(id);
  }
  
  async toggleActive(id: string, userId: string): Promise<ILeaveRule> {
    const leaveRule = await LeaveRuleModel.findById(id);
    if (!leaveRule) {
      throw new AppError('Leave rule not found', 404);
    }
    
    leaveRule.is_active = !leaveRule.is_active;
    leaveRule.updated_by = new Types.ObjectId(userId);
    await leaveRule.save();
    return leaveRule;
  }
  
  // Cycle management
  async addCycle(ruleId: string, cycleData: Partial<ILeaveCycle>, userId: string): Promise<ILeaveRule> {
    const leaveRule = await LeaveRuleModel.findById(ruleId);
    if (!leaveRule) {
      throw new AppError('Leave rule not found', 404);
    }
    
    leaveRule.cycles.push(cycleData as ILeaveCycle);
    leaveRule.updated_by = new Types.ObjectId(userId);
    await leaveRule.save();
    return leaveRule;
  }
  
  async updateCycle(ruleId: string, cycleId: string, cycleData: Partial<ILeaveCycle>, userId: string): Promise<ILeaveRule> {
    const leaveRule = await LeaveRuleModel.findById(ruleId);
    if (!leaveRule) {
      throw new AppError('Leave rule not found', 404);
    }
    
    const cycleIndex = leaveRule.cycles.findIndex(c => c._id?.toString() === cycleId);
    if (cycleIndex === -1) {
      throw new AppError('Cycle not found', 404);
    }
    
    Object.assign(leaveRule.cycles[cycleIndex], cycleData);
    leaveRule.updated_by = new Types.ObjectId(userId);
    await leaveRule.save();
    return leaveRule;
  }
  
  async deleteCycle(ruleId: string, cycleId: string, userId: string): Promise<ILeaveRule> {
    const leaveRule = await LeaveRuleModel.findById(ruleId);
    if (!leaveRule) {
      throw new AppError('Leave rule not found', 404);
    }
    
    leaveRule.cycles = leaveRule.cycles.filter(c => c._id?.toString() !== cycleId);
    leaveRule.updated_by = new Types.ObjectId(userId);
    await leaveRule.save();
    return leaveRule;
  }
  
  // Seed default leave rules
  async seedDefaultRules(userId: string): Promise<void> {
    const defaultRules = [
      {
        name: 'Annual Leave',
        description: 'Standard annual leave policy per BCEA - 15 days per year',
        cycles: [{
          cycle_start_date: new Date('2025-01-01'),
          cycle_length: '12 months',
          cycle_recurs: 'Annually',
          entitlement_value: 15,
          leave_accrual: 'Upfront',
          balance_at_end_of_cycle: 0,
          leave_taken_order: 1,
          allow_exceed: 'do_not_allow' as const
        }]
      },
      {
        name: 'Sick Leave',
        description: 'Sick leave policy per BCEA guidelines - 10 days per year',
        cycles: [{
          cycle_start_date: new Date('2025-01-01'),
          cycle_length: '12 months',
          cycle_recurs: 'Annually',
          entitlement_value: 10,
          leave_accrual: 'Upfront',
          balance_at_end_of_cycle: 0,
          leave_taken_order: 1,
          allow_exceed: 'allow_with_warning' as const
        }]
      },
      {
        name: 'Family Leave',
        description: 'Family responsibility leave - 3 days per year',
        cycles: [{
          cycle_start_date: new Date('2025-01-01'),
          cycle_length: '12 months',
          cycle_recurs: 'Annually',
          entitlement_value: 3,
          leave_accrual: 'Upfront',
          balance_at_end_of_cycle: 0,
          leave_taken_order: 1,
          allow_exceed: 'do_not_allow' as const
        }]
      },
      {
        name: 'Maternity Leave',
        description: 'Maternity leave policy - 4 months per pregnancy',
        cycles: [{
          cycle_start_date: new Date('2025-01-01'),
          cycle_length: 'Per pregnancy',
          cycle_recurs: 'As needed',
          entitlement_value: 4,
          leave_accrual: 'Upfront',
          balance_at_end_of_cycle: 0,
          leave_taken_order: 1,
          allow_exceed: 'do_not_allow' as const
        }]
      },
      {
        name: 'Study Leave',
        description: 'Study leave policy - subject to manager approval',
        cycles: [{
          cycle_start_date: new Date('2025-01-01'),
          cycle_length: '12 months',
          cycle_recurs: 'Annually',
          entitlement_value: 5,
          leave_accrual: 'As needed',
          balance_at_end_of_cycle: 5,
          leave_taken_order: 1,
          allow_exceed: 'allow_without_warning' as const
        }]
      }
    ];
    
    for (const rule of defaultRules) {
      const existing = await LeaveRuleModel.findOne({ name: rule.name });
      if (!existing) {
        await this.create(rule, userId);
      }
    }
  }
}
