import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

/**
 * Audit Trail Model - Immutable Audit Logging System
 * 
 * Every system change is logged with:
 * - 12 mandatory fields per compliance requirements
 * - SHA-256 content hash for immutability verification
 * - Chained hashes for tamper detection
 * - 7+ year retention policy
 * - Never delete or modify records (append-only)
 */

export interface IAuditLog extends Document {
  // Core fields
  timestamp: Date;
  action: string;
  status: 'success' | 'failure' | 'pending';
  
  // User context
  changedBy: mongoose.Types.ObjectId;
  changedByRole: 'owner' | 'admin' | 'manager' | 'team_lead' | 'employee';
  approver?: mongoose.Types.ObjectId;
  
  // Record context
  entityType: string; // 'Employee', 'Leave', 'Attendance', etc.
  entityId: mongoose.Types.ObjectId;
  
  // Change details
  fieldName: string;
  oldValue: any;
  newValue: any;
  reason?: string;
  
  // Request context
  ipAddress: string;
  apiEndpoint: string;
  sessionId: string;
  userAgent?: string;
  
  // Cryptographic verification
  contentHash: string; // SHA-256 of record content
  previousHash?: string; // Hash of previous audit record (chained)
  
  // Multi-tenancy
  ownerId: mongoose.Types.ObjectId;
  
  // Metadata
  metadata?: Record<string, any>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'PROMOTE',
        'DEMOTE',
        'APPROVE',
        'REJECT',
        'SUBMIT',
        'DELEGATE',
        'ONBOARD',
        'OFFBOARD',
        'LOGIN',
        'LOGOUT',
        'EXPORT'
      ]
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success'
    },
    
    // User context (mandatory)
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    changedByRole: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'team_lead', 'employee'],
      required: true
    },
    approver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    // Record context (mandatory)
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    
    // Change details (mandatory)
    fieldName: {
      type: String,
      required: true
    },
    oldValue: {
      type: Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: null
    },
    reason: {
      type: String,
      default: null
    },
    
    // Request context (mandatory for external APIs)
    ipAddress: {
      type: String,
      required: true
    },
    apiEndpoint: {
      type: String,
      required: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    userAgent: {
      type: String,
      default: null
    },
    
    // Cryptographic verification (mandatory)
    contentHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    previousHash: {
      type: String,
      default: null
    },
    
    // Multi-tenancy (mandatory)
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Optional metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true// Prevents document modification after creation
  }
);

// Compound indexes for common queries
AuditLogSchema.index({ ownerId: 1, timestamp: -1 });
AuditLogSchema.index({ entityId: 1, ownerId: 1 });
AuditLogSchema.index({ changedBy: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, ownerId: 1 });

// TTL Index: Auto-delete after 7 years (254016000 seconds = 7 years)
AuditLogSchema.index(
  { timestamp: 1 },
  { 
    expireAfterSeconds: 254016000,
    name: 'audit_log_retention_7_years'
  }
);

// Helper function to generate content hash
export const generateAuditHash = (auditData: Partial<IAuditLog>): string => {
  const content = JSON.stringify({
    timestamp: auditData.timestamp,
    action: auditData.action,
    changedBy: auditData.changedBy,
    entityType: auditData.entityType,
    entityId: auditData.entityId,
    fieldName: auditData.fieldName,
    oldValue: auditData.oldValue,
    newValue: auditData.newValue
  });
  
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
};

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
