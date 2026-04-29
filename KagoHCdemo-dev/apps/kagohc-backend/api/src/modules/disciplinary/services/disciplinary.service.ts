import { DisciplinaryCase } from '../models/disciplinaryCase.model';
import { DisciplinaryHearing } from '../models/disciplinaryHearing.model';
import { DisciplinarySanction } from '../models/disciplinarySanction.model';
import { DisciplinaryAppeal } from '../models/disciplinaryAppeal.model';
import { DisciplinaryIncident } from '../models/disciplinaryIncident.model';
import mongoose from 'mongoose';

export class DisciplinaryService {
  
  async createCase(data: any, userId: string) {
    const disciplinaryCase = new DisciplinaryCase({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    await disciplinaryCase.save();
    return disciplinaryCase;
  }

  async getCases(filters: any = {}) {
    const query: any = {};
    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    
    const cases = await DisciplinaryCase.find(query)
      .populate('employeeId', 'firstName lastName employeeId')
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    return cases;
  }

  async getCaseById(id: string) {
    const disciplinaryCase = await DisciplinaryCase.findById(id)
      .populate('employeeId', 'firstName lastName employeeId email')
      .populate('reportedBy', 'firstName lastName')
      .populate('investigationOfficer', 'firstName lastName');
    
    if (!disciplinaryCase) throw new Error('Case not found');
    return disciplinaryCase;
  }

  async updateCase(id: string, data: any, userId: string) {
    const updatedCase = await DisciplinaryCase.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true }
    );
    if (!updatedCase) throw new Error('Case not found');
    return updatedCase;
  }

  async scheduleHearing(data: any, userId: string) {
    const hearing = new DisciplinaryHearing({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    await hearing.save();
    
    await DisciplinaryCase.findByIdAndUpdate(data.caseId, {
      status: 'hearing_scheduled'
    });
    
    return hearing;
  }

  async createSanction(data: any, userId: string) {
    const sanction = new DisciplinarySanction({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    await sanction.save();
    return sanction;
  }

  async createAppeal(data: any, userId: string) {
    const appeal = new DisciplinaryAppeal({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    await appeal.save();
    return appeal;
  }

  async reportIncident(data: any, userId: string) {
    const incident = new DisciplinaryIncident({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    await incident.save();
    return incident;
  }

  async getDisciplinaryReport(filters: any) {
    const matchStage: any = {};
    if (filters.startDate) matchStage.createdAt = { $gte: new Date(filters.startDate) };
    if (filters.endDate) matchStage.createdAt = { ...matchStage.createdAt, $lte: new Date(filters.endDate) };
    
    const report = await DisciplinaryCase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: '$category', severity: '$severity' },
          count: { $sum: 1 }
        }
      }
    ]);
    return report;
  }

  async getEmployeeDisciplinaryHistory(employeeId: string) {
    const cases = await DisciplinaryCase.find({ employeeId }).sort({ createdAt: -1 });
    return { cases, count: cases.length };
  }

  async getTrendAnalysis(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const trends = await DisciplinaryCase.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, category: '$category' },
          count: { $sum: 1 }
        }
      }
    ]);
    return trends;
  }
}
