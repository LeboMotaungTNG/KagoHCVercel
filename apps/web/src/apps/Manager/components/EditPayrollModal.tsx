import React, { useState, useEffect } from 'react';

interface PayrollEmployee {
  id: string;
  fullName: string;
  employeeCode: string;
  department: string;
  position: string;
  onPayroll: boolean;
  employmentStatus: "active" | "inactive" | "probation";
  basicSalary: number;
  netSalary: number;
  paymentFrequency: "Monthly" | "Weekly" | "Bi-weekly";
  employmentType: "Full-time" | "Part-time" | "Contract";
}

interface EditPayrollModalProps {
  isOpen: boolean;
  employee: PayrollEmployee | null;
  onClose: () => void;
  onSave: (updatedEmployee: PayrollEmployee) => Promise<void>;
}

const EditPayrollModal: React.FC<EditPayrollModalProps> = ({ isOpen, employee, onClose, onSave }) => {
  const [formData, setFormData] = useState<PayrollEmployee | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({ ...employee });
      setError(null);
    }
  }, [employee]);

  if (!isOpen || !formData) return null;

  const handleSave = async () => {
    if (!formData) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PayrollEmployee, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 550,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1d2939' }}>Edit Payroll</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#667085'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Employee Code</label>
          <input
            type="text"
            value={formData.employeeCode}
            disabled
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              backgroundColor: '#f9fafb',
              color: '#667085'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Position</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Department</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Basic Salary (R)</label>
          <input
            type="number"
            value={formData.basicSalary}
            onChange={(e) => handleInputChange('basicSalary', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Net Salary (R)</label>
          <input
            type="number"
            value={formData.netSalary}
            onChange={(e) => handleInputChange('netSalary', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Payment Frequency</label>
          <select
            value={formData.paymentFrequency}
            onChange={(e) => handleInputChange('paymentFrequency', e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none',
              backgroundColor: '#fff'
            }}
          >
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
            <option value="Bi-weekly">Bi-weekly</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Employment Type</label>
          <select
            value={formData.employmentType}
            onChange={(e) => handleInputChange('employmentType', e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none',
              backgroundColor: '#fff'
            }}
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>Employment Status</label>
          <select
            value={formData.employmentStatus}
            onChange={(e) => handleInputChange('employmentStatus', e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none',
              backgroundColor: '#fff'
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="probation">Probation</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#344054' }}>On Payroll</label>
          <select
            value={formData.onPayroll ? "true" : "false"}
            onChange={(e) => handleInputChange('onPayroll', e.target.value === "true")}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              outline: 'none',
              backgroundColor: '#fff'
            }}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #d0d5dd',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: '#344054'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: saving ? '#ccc' : '#E6A79E',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPayrollModal;
