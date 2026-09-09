import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Delegation } from '../../types/delegation.types';

interface DelegationDetailsProps {
  delegation: Delegation;
  onClose: () => void;
  onRevoke: () => void;
}

const DelegationDetails: React.FC<DelegationDetailsProps> = ({ delegation, onClose, onRevoke }) => {
  const { user } = useAuth();
  const isDelegator = user?.id === delegation.delegatorId || user?._id === delegation.delegatorId;

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatus = () => {
    const now = new Date();
    const start = new Date(delegation.startDate);
    const end = new Date(delegation.endDate);

    if (!delegation.isActive) return 'Revoked';
    if (now < start) return 'Upcoming';
    if (now > end) return 'Expired';
    return 'Active';
  };

  const getStatusColor = () => {
    switch (getStatus()) {
      case 'Active':
        return 'text-success';
      case 'Revoked':
        return 'text-danger';
      case 'Expired':
        return 'text-warning';
      default:
        return 'text-info';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h4>Delegation Details</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="details-grid">
            <div className="detail-item">
              <label>Delegator</label>
              <div>
                <strong>{delegation.delegatorName}</strong>
                <br />
                <small className="text-muted">{delegation.delegatorEmail}</small>
              </div>
            </div>

            <div className="detail-item">
              <label>Delegate (Acting Manager)</label>
              <div>
                <strong>{delegation.delegateName}</strong>
                <br />
                <small className="text-muted">{delegation.delegateEmail}</small>
              </div>
            </div>

            <div className="detail-item">
              <label>Period</label>
              <div>
                <strong>From:</strong> {formatDate(delegation.startDate)}
                <br />
                <strong>To:</strong> {formatDate(delegation.endDate)}
              </div>
            </div>

            <div className="detail-item">
              <label>Status</label>
              <div className={getStatusColor()}>
                <strong>{getStatus()}</strong>
                {delegation.revocationReason && (
                  <div className="text-muted small">Reason: {delegation.revocationReason}</div>
                )}
              </div>
            </div>

            <div className="detail-item full-width">
              <label>Scope of Authority</label>
              <div>
                <div>
                  <strong>Roles:</strong>
                  <div className="tags">
                    {delegation.scope.roles.map((role) => (
                      <span key={role} className="badge bg-info">{role}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <strong>Leave Types:</strong>
                  <div className="tags">
                    {delegation.scope.leaveTypes.map((type) => (
                      <span key={type} className="badge bg-secondary">{type}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {delegation.reason && (
              <div className="detail-item full-width">
                <label>Reason</label>
                <div>{delegation.reason}</div>
              </div>
            )}

            <div className="detail-item full-width">
              <label>Created</label>
              <div className="text-muted small">{new Date(delegation.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {isDelegator && delegation.isActive && (
            <button className="btn btn-danger" onClick={onRevoke}>Revoke Delegation</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DelegationDetails;
