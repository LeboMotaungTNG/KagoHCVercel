import { Employee, IEmployee } from '../models/employee.model';
import { User } from '../../../../src/models/User';
import mongoose from 'mongoose';

export class EmployeeService {
  async findAll(filter: any = {}, page?: number, limit?: number): Promise<IEmployee[]> {
    let query = Employee.find(filter);
    
    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }
    
    return await query.exec();
  }

  async findById(id: string): Promise<IEmployee | null> {
    return await Employee.findById(id).populate('userId', 'email').exec();
  }

  async findByEmail(email: string): Promise<IEmployee | null> {
    return await Employee.findOne({ email }).exec();
  }

  async findByUserId(userId: string): Promise<IEmployee | null> {
    return await Employee.findOne({ userId }).exec();
  }

  async create(employeeData: Partial<IEmployee>): Promise<IEmployee> {
    const employee = new Employee(employeeData);
    return await employee.save();
  }

  async update(id: string, employeeData: Partial<IEmployee>): Promise<IEmployee | null> {
    return await Employee.findByIdAndUpdate(id, employeeData, { new: true }).exec();
  }

  async delete(id: string): Promise<IEmployee | null> {
    return await Employee.findByIdAndDelete(id).exec();
  }

  async count(filter: any = {}): Promise<number> {
    return await Employee.countDocuments(filter).exec();
  }
}

export default new EmployeeService();
