import React, { useEffect, useState } from 'react';
import { delegationApi } from '../../api/delegation.api';
import type { DelegationAuditLog } from '../../types/delegation.types';

const DelegationAuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<DelegationAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      setLoading(true);
      try {
        const response = await delegationApi.getAuditTrail({ limit: 50 });
        setLogs(response.logs || []);
      } catch (error) {
        console.error('Failed to fetch audit trail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DELEGATION_CREATED':
        return '📝';
      case 'DELEGATION_REVOKED':
        return '🔒';
      case 'APPROVE_DELEGATED':
        return '✅';
      case 'REJECT_DELEGATED':
        return '❌';
      default:
        return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELEGATION_CREATED':
        return 'text-primary';
      case 'DELEGATION_REVOKED':
        return 'text-danger';
      case 'APPROVE_DELEGATED':
        return 'text-success';
      case 'REJECT_DELEGATED':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  };

  if (loading) {
    return <div>Loading audit trail...</div>;
  }

  return (
    <div className="delegation-audit-trail">
      <h4>📋 Delegation Audit Trail</h4>

      {logs.length === 0 ? (
        <p className="text-muted">No audit logs found.</p>
      ) : (
        <div className="timeline">
          {logs.map((log) => (
            <div key={log._id} className="timeline-item">
              <div className="timeline-icon">{getActionIcon(log.action)}</div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className={`timeline-action ${getActionColor(log.action)}`}>
                    {log.action.replace('_', ' ')}
                  </span>
                  <span className="timeline-time">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="timeline-message">{log.message}</div>
                <div className="timeline-user text-muted small">By: {log.userEmail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DelegationAuditTrail;
