import React, { useEffect, useState } from 'react';
import { useDelegation } from '../../hooks/useDelegation';
import type { Delegation } from '../../types/delegation.types';
import DelegationDetails from './DelegationDetails';
import DelegationRevokeModal from './DelegationRevokeModal';

const DelegationList: React.FC = () => {
  const { delegations, fetchDelegations, loading, pagination } = useDelegation();
  const [filter, setFilter] = useState<'all' | 'delegated-by-me' | 'delegated-to-me'>('all');
  const [showActive, setShowActive] = useState(true);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    fetchDelegations({
      type: filter,
      isActive: showActive ? true : undefined,
      page: 1,
      limit: 10,
    });
  }, [fetchDelegations, filter, showActive]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getStatusBadge = (delegation: Delegation) => {
    const now = new Date();
    const start = new Date(delegation.startDate);
    const end = new Date(delegation.endDate);

    if (!delegation.isActive) {
      return <span className="badge bg-secondary">Revoked</span>;
    }
    if (now < start) {
      return <span className="badge bg-info">Upcoming</span>;
    }
    if (now > end) {
      return <span className="badge bg-warning">Expired</span>;
    }
    return <span className="badge bg-success">Active</span>;
  };

  if (loading) {
    return <div className="text-center py-4">Loading delegations...</div>;
  }

  return (
    <div className="delegation-list">
      <div className="list-header">
        <h3>Delegations</h3>
        <div className="filter-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'delegated-by-me' | 'delegated-to-me')}
            className="form-control"
          >
            <option value="all">All Delegations</option>
            <option value="delegated-by-me">Delegated By Me</option>
            <option value="delegated-to-me">Delegated To Me</option>
          </select>
          <label className="ml-2">
            <input
              type="checkbox"
              checked={showActive}
              onChange={(e) => setShowActive(e.target.checked)}
            />
            Show Active Only
          </label>
        </div>
      </div>

      {delegations.length === 0 ? (
        <div className="empty-state">
          <p>No delegations found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Delegator</th>
                  <th>Delegate</th>
                  <th>Period</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {delegations.map((delegation) => (
                  <tr key={delegation._id}>
                    <td>
                      <strong>{delegation.delegatorName}</strong>
                      <br />
                      <small className="text-muted">{delegation.delegatorEmail}</small>
                    </td>
                    <td>
                      <strong>{delegation.delegateName}</strong>
                      <br />
                      <small className="text-muted">{delegation.delegateEmail}</small>
                    </td>
                    <td>
                      {formatDate(delegation.startDate)} - {formatDate(delegation.endDate)}
                    </td>
                    <td>
                      <span className="badge bg-info">{delegation.scope.roles.join(', ')}</span>
                      <span className="badge bg-secondary ml-1">{delegation.scope.leaveTypes.join(', ')}</span>
                    </td>
                    <td>{getStatusBadge(delegation)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary mr-1"
                        onClick={() => setSelectedDelegation(delegation)}
                      >
                        Details
                      </button>
                      {delegation.isActive && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            setSelectedDelegation(delegation);
                            setShowRevokeModal(true);
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <span>
              Showing {delegations.length} of {pagination.total} delegations
            </span>
          </div>
        </>
      )}

      {selectedDelegation && (
        <DelegationDetails
          delegation={selectedDelegation}
          onClose={() => setSelectedDelegation(null)}
          onRevoke={() => setShowRevokeModal(true)}
        />
      )}

      {showRevokeModal && selectedDelegation && (
        <DelegationRevokeModal
          delegation={selectedDelegation}
          onClose={() => {
            setShowRevokeModal(false);
            setSelectedDelegation(null);
          }}
          onSuccess={() => {
            setShowRevokeModal(false);
            setSelectedDelegation(null);
            fetchDelegations();
          }}
        />
      )}
    </div>
  );
};

export default DelegationList;
