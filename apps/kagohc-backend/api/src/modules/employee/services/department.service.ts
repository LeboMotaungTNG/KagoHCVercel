import { DepartmentModel, IDepartment } from '../models/department.model';
import { Types } from 'mongoose';

export class DepartmentService {
  
  async create(data: Partial<IDepartment>, userId: string): Promise<IDepartment> {
    const department = await DepartmentModel.create({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return department;
  }

  async findAll(query: any = {}): Promise<IDepartment[]> {
    const filter: any = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }
    
    return await DepartmentModel.find(filter)
      .populate('managerId', 'firstName lastName email')
      .populate('parentDepartment', 'name')
      .sort({ name: 1 });
  }

  async findById(id: string): Promise<IDepartment | null> {
    return await DepartmentModel.findById(id)
      .populate('managerId')
      .populate('parentDepartment');
  }

  async update(id: string, data: Partial<IDepartment>, userId: string): Promise<IDepartment | null> {
    return await DepartmentModel.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await DepartmentModel.findByIdAndDelete(id);
    return result !== null;
  }

  async getHierarchy(): Promise<any> {
    const departments = await DepartmentModel.find({ isActive: true })
      .populate('managerId', 'firstName lastName')
      .lean();
    
    // Build tree structure
    const deptMap = new Map();
    const roots: any[] = [];
    
    departments.forEach(dept => {
      deptMap.set(dept._id.toString(), { ...dept, children: [] });
    });
    
    departments.forEach(dept => {
      if (dept.parentDepartment) {
        const parent = deptMap.get(dept.parentDepartment.toString());
        if (parent) {
          parent.children.push(deptMap.get(dept._id.toString()));
        }
      } else {
        roots.push(deptMap.get(dept._id.toString()));
      }
    });
    
    return roots;
  }
}
