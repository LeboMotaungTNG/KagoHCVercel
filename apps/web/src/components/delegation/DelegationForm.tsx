import React, { useEffect, useState } from 'react';
import { useDelegation } from '../../hooks/useDelegation';
import { useEmployees } from '../../hooks/useEmployees';

interface DelegationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DelegationForm: React.FC<DelegationFormProps> = ({ onSuccess, onCancel }) => {
  const { createDelegation, loading } = useDelegation();
  const { employees, fetchEmployees } = useEmployees();
  const [formData, setFormData] = useState({
    delegateId: '',
    delegateName: '',
    delegateEmail: '',
    startDate: '',
    endDate: '',
    reason: '',
    scope: {
      roles: ['hr_manager'] as string[],
      leaveTypes: ['annual', 'sick', 'compassionate'] as string[],
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelegateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const delegateId = event.target.value;
    const delegate = employees.find((emp: any) => emp._id === delegateId || emp.id === delegateId);

    if (!delegate) {
      setFormData((current) => ({ ...current, delegateId: '', delegateName: '', delegateEmail: '' }));
      return;
    }

    setFormData((current) => ({
      ...current,
      delegateId: delegate._id || delegate.id,
      delegateName: `${delegate.firstName || ''} ${delegate.lastName || ''}`.trim(),
      delegateEmail: delegate.email || '',
    }));
  };

  const handleScopeChange = (type: 'roles' | 'leaveTypes', value: string[]) => {
    setFormData((current) => ({
      ...current,
      scope: {
        ...current.scope,
        [type]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.delegateId || !formData.startDate || !formData.endDate) {
      return;
    }

    try {
      await createDelegation({
        delegateId: formData.delegateId,
        delegateName: formData.delegateName,
        delegateEmail: formData.delegateEmail,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        scope: formData.scope,
        reason: formData.reason || undefined,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create delegation:', error);
    }
  };

  return (
    <div className="delegation-form">
      <h3>Create Delegation of Authority</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Delegate (Acting Manager)</label>
          <select
            value={formData.delegateId}
            onChange={handleDelegateChange}
            required
            className="form-control"
          >
            <option value="">Select a delegate...</option>
            {employees.map((emp: any) => (
              <option key={emp._id || emp.id} value={emp._id || emp.id}>
                {emp.firstName} {emp.lastName} ({emp.email})
              </option>
            ))}
          </select>
          <small className="form-text text-muted">Select the person who will act on your behalf</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData((current) => ({ ...current, startDate: e.target.value }))}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData((current) => ({ ...current, endDate: e.target.value }))}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Reason</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData((current) => ({ ...current, reason: e.target.value }))}
            placeholder="Why are you delegating authority (e.g., On leave, Out of office)"
            className="form-control"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Scope of Authority</label>
          <div className="scope-section">
            <div>
              <label>Roles</label>
              <div className="checkbox-group">
                {['hr_manager', 'line_manager', 'payroll_officer'].map((role) => (
                  <label key={role}>
                    <input
                      type="checkbox"
                      checked={formData.scope.roles.includes(role)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...formData.scope.roles, role]
                          : formData.scope.roles.filter((r) => r !== role);
                        handleScopeChange('roles', newRoles);
                      }}
                    />
                    {role.replace('_', ' ').toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label>Leave Types</label>
              <div className="checkbox-group">
                {['annual', 'sick', 'compassionate', 'family_responsibility'].map((type) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={formData.scope.leaveTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...formData.scope.leaveTypes, type]
                          : formData.scope.leaveTypes.filter((t) => t !== type);
                        handleScopeChange('leaveTypes', newTypes);
                      }}
                    />
                    {type.replace('_', ' ').toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating...' : 'Create Delegation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DelegationForm;
