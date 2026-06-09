import React, { useState, useEffect } from 'react';
import PromoteToManagerModal from './PromoteToManagerModal';

/**
 * ManagersPage Component Example
 * 
 * This example page shows how to:
 * 1. Display a list of managers
 * 2. Show a button to promote employees to manager
 * 3. Use the PromoteToManagerModal component
 */

interface Manager {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  managerLevel: string;
  managerSince: string;
  department: string;
}

const ManagersPage: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch managers
  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${API_URL}/employees?isManager=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch managers');
      }

      const data = await response.json();
      setManagers(data.data.filter((emp: any) => emp.isManager));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load managers');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (employeeId: string, managerLevel: string, reason?: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${API_URL}/employees/${employeeId}/promote-to-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          managerLevel,
          reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Promotion failed');
      }

      const result = await response.json();
      
      // Show success message
      setSuccessMessage(`${result.data.firstName} ${result.data.lastName} has been promoted to ${managerLevel}!`);
      
      // Refresh the manager list
      setTimeout(() => {
        fetchManagers();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      throw err;
    }
  };

  const handleDemote = async (managerId: string, reason?: string) => {
    if (!window.confirm('Are you sure you want to demote this manager?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${API_URL}/employees/${managerId}/demote-from-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Demotion failed');
      }

      setSuccessMessage('Manager has been demoted successfully!');
      setTimeout(() => {
        fetchManagers();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demotion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Managers</h1>
        <p style={{ margin: 0, color: '#666' }}>Manage employee promotions and manager assignments</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
            color: '#3c3',
            fontSize: '14px'
          }}
        >
          {successMessage}
        </div>
      )}

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

      {/* Promote Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setIsPromoteModalOpen(true)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Promote Employee to Manager
        </button>
      </div>

      {/* Managers Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          Loading managers...
        </div>
      ) : managers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No managers yet. Promote an employee to get started.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Level</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Department</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Since</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map(manager => (
                <tr key={manager._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    {manager.firstName} {manager.lastName}
                  </td>
                  <td style={{ padding: '12px' }}>{manager.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: '#e7f3ff',
                        color: '#0066cc',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {manager.managerLevel?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{manager.department}</td>
                  <td style={{ padding: '12px' }}>
                    {new Date(manager.managerSince).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleDemote(manager._id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: '#fee',
                        color: '#c33',
                        border: '1px solid #fcc',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Demote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Promote Modal */}
      <PromoteToManagerModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        onPromote={handlePromote}
      />
    </div>
  );
};

export default ManagersPage;
