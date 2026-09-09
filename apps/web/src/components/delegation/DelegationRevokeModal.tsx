import React, { useState } from 'react';
import { useDelegation } from '../../hooks/useDelegation';
import type { Delegation } from '../../types/delegation.types';

interface DelegationRevokeModalProps {
  delegation: Delegation;
  onClose: () => void;
  onSuccess: () => void;
}

const DelegationRevokeModal: React.FC<DelegationRevokeModalProps> = ({ delegation, onClose, onSuccess }) => {
  const { revokeDelegation, loading } = useDelegation();
  const [reason, setReason] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await revokeDelegation(delegation._id, { reason });
      onSuccess();
    } catch (error) {
      console.error('Failed to revoke delegation:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h4>Revoke Delegation</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>
              You are about to revoke the delegation from <strong>{delegation.delegatorName}</strong> to{' '}
              <strong>{delegation.delegateName}</strong>.
            </p>
            <p className="text-muted">
              Period: {new Date(delegation.startDate).toLocaleDateString()} -{' '}
              {new Date(delegation.endDate).toLocaleDateString()}
            </p>

            <div className="form-group">
              <label>Revocation Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for revoking this delegation..."
                required
                className="form-control"
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading || !reason} className="btn btn-danger">
              {loading ? 'Revoking...' : 'Revoke Delegation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DelegationRevokeModal;
