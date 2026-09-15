import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDelegation } from '../../hooks/useDelegation';

const DelegationDashboardWidget: React.FC = () => {
  const { user } = useAuth();
  const { fetchManagementActiveDelegations, loading } = useDelegation();
  const [activeDelegations, setActiveDelegations] = React.useState<Awaited<ReturnType<typeof fetchManagementActiveDelegations>>>([]);

  useEffect(() => {
    if (user?.id || user?._id) {
      fetchManagementActiveDelegations().then(setActiveDelegations).catch(() => setActiveDelegations([]));
    }
  }, [fetchManagementActiveDelegations, user]);

  if (loading) {
    return <div className="widget-loading">Loading...</div>;
  }

  if (activeDelegations.length === 0) {
    return (
      <div className="delegation-widget">
        <div className="widget-header">
          <h5>📋 Authority Delegations</h5>
        </div>
        <div className="widget-body">
          <p className="text-muted">No active delegations</p>
          <Link to="/delegations" className="btn btn-sm btn-outline-primary">Manage Delegations</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="delegation-widget">
      <div className="widget-header">
        <h5>📋 Current Delegations</h5>
        <span className="badge bg-primary">{activeDelegations.length}</span>
      </div>
      <div className="widget-body">
        {activeDelegations.map((delegation) => (
          <div key={delegation._id} className="delegation-item">
            <div className="delegation-info">
              <strong>{delegation.delegatorName}</strong>
              <span className="arrow">→</span>
              <span>{delegation.delegateName}</span>
            </div>
            <div className="delegation-meta small text-muted">
              <span className={`badge ${new Date(delegation.startDate) > new Date() ? 'bg-info' : 'bg-success'}`}>
                {new Date(delegation.startDate) > new Date() ? 'Upcoming' : 'Active'}
              </span>
              <span>Valid until: {new Date(delegation.endDate).toLocaleDateString()}</span>
              <span className="badge bg-info ml-1">{delegation.scope.roles.join(', ')}</span>
            </div>
            <Link to={`/delegations/${delegation._id}`} className="btn btn-sm btn-outline-primary mt-1">View</Link>
          </div>
        ))}
        <div className="widget-footer">
          <Link to="/delegations" className="btn btn-sm btn-primary w-100">Manage All Delegations</Link>
        </div>
      </div>
    </div>
  );
};

export default DelegationDashboardWidget;
