import mongoose, { Schema, Document } from 'mongoose';

/**
 * Employee Hierarchy Model
 * 
 * Bridge table tracking manager-employee relationships across multi-level organization structure.
 * Supports: Employee → Team Lead → Manager → Senior Manager → Director → Owner
 */

export interface IEmployeeHierarchy extends Document {
  employeeId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  reportingLevel: number; // 1=Team Lead, 2=Manager, 3=Senior Manager, 4=Director, 5=Owner
  managerLevel: 'team_lead' | 'manager' | 'senior_manager' | 'director' | 'owner';
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'inactive';
  ownerId: mongoose.Types.ObjectId; // For multi-tenancy
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeHierarchySchema = new Schema<IEmployeeHierarchy>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    reportingLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
      description: '1=Team Lead, 2=Manager, 3=Senior Manager, 4=Director, 5=Owner'
    },
    managerLevel: {
      type: String,
      enum: ['team_lead', 'manager', 'senior_manager', 'director', 'owner'],
      required: true
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
EmployeeHierarchySchema.index({ employeeId: 1, ownerId: 1 });
EmployeeHierarchySchema.index({ managerId: 1, ownerId: 1 });
EmployeeHierarchySchema.index({ departmentId: 1, ownerId: 1 });
EmployeeHierarchySchema.index({ employeeId: 1, managerId: 1, status: 1 });

export const EmployeeHierarchy = mongoose.model<IEmployeeHierarchy>(
  'EmployeeHierarchy',
  EmployeeHierarchySchema
);
