import React, { useEffect, useState } from 'react';

/**
 * PromoteToManagerModal Component
 * 
 * This component provides a UI for promoting employees to manager roles.
 * It should be placed in your React frontend's components directory.
 * 
 * Usage in parent component:
 * const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
 * <PromoteToManagerModal 
 *   isOpen={isPromoteModalOpen}
 *   onClose={() => setIsPromoteModalOpen(false)}
 *   onPromote={handlePromote}
 * />
 */

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  hireDate: Date;
  isManager: boolean;
}

interface PromoteToManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromote: (employeeId: string, managerLevel: string, reason?: string) => Promise<void>;
}

const PromoteToManagerModal: React.FC<PromoteToManagerModalProps> = ({
  isOpen,
  onClose,
  onPromote
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [managerLevel, setManagerLevel] = useState<string>('manager');
  const [reason, setReason] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch eligible employees (non-managers only)
  useEffect(() => {
    if (isOpen) {
      const fetchEligibleEmployees = async () => {
        try {
          setLoading(true);
          setError('');
          const token = localStorage.getItem('token');
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
          
          const response = await fetch(`${API_URL}/employees?isManager=false`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch employees');
          }
          
          const data = await response.json();
          // Filter out managers
          const nonManagers = data.data.filter((emp: Employee) => !emp.isManager);
          setEmployees(nonManagers);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load employees');
          console.error('Fetch error:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchEligibleEmployees();
    }
  }, [isOpen]);

  const handlePromote = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onPromote(selectedEmployee, managerLevel, reason);
      
      // Reset form
      setSelectedEmployee('');
      setManagerLevel('manager');
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotion failed');
      console.error('Promotion error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
            Promote Employee to Manager
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Promote a non-manager employee to a management position
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              color: '#c33',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}

        {/* Employee Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Select Employee *
          </label>
          <select
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
            required
          >
            <option value="">-- Select an employee --</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName} - {emp.position} (since {new Date(emp.hireDate).toLocaleDateString()})
              </option>
            ))}
          </select>
          {employees.length === 0 && !loading && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
              No non-manager employees available
            </p>
          )}
        </div>

        {/* Manager Level Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Manager Level *
          </label>
          <select
            value={managerLevel}
            onChange={e => setManagerLevel(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          >
            <option value="team_lead">Team Lead</option>
            <option value="manager">Manager</option>
            <option value="senior_manager">Senior Manager</option>
            <option value="director">Director</option>
          </select>
        </div>

        {/* Reason for Promotion */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Reason for Promotion
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g., Performance excellence, team expansion, restructuring..."
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              minHeight: '80px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePromote}
            disabled={!selectedEmployee || loading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: !selectedEmployee || loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !selectedEmployee || loading ? 'not-allowed' : 'pointer',
              opacity: !selectedEmployee || loading ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : 'Promote to Manager'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteToManagerModal;
