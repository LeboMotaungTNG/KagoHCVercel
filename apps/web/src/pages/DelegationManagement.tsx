import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { normalizeAppRole } from '../shared/components/RequireAuth';
import DelegationForm from '../components/delegation/DelegationForm';
import DelegationList from '../components/delegation/DelegationList';
import DelegationAuditTrail from '../components/delegation/DelegationAuditTrail';
import DelegationDashboardWidget from '../components/delegation/DelegationDashboardWidget';

const DelegationManagement: React.FC = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'delegations' | 'audit'>('delegations');

  const normalizedRole = normalizeAppRole(user?.role || '');
  const canCreateDelegation = ['owner', 'admin', 'hr'].includes(normalizedRole);

  return (
    <div className="delegation-management">
      <div className="page-header">
        <h1>Delegation of Authority</h1>
        <p className="text-muted">
          Manage temporary authority hand-offs for approvals and decision-making
        </p>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <DelegationDashboardWidget />
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5>ℹ️ How Delegation Works</h5>
              <p>
                When you're going to be unavailable (leave, out of office, etc.), you can delegate your approval authority to another manager. They will be able to approve or reject leave requests on your behalf.
              </p>
              {canCreateDelegation && (
                <button className="btn btn-primary" onClick={() => setShowForm((current) => !current)}>
                  {showForm ? 'Cancel' : '+ New Delegation'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showForm && canCreateDelegation && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <DelegationForm
                  onSuccess={() => setShowForm(false)}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'delegations' ? 'active' : ''}`}
            onClick={() => setActiveTab('delegations')}
          >
            📋 Delegations
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            🔍 Audit Trail
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {activeTab === 'delegations' && <DelegationList />}
        {activeTab === 'audit' && <DelegationAuditTrail />}
      </div>
    </div>
  );
};

export default DelegationManagement;
