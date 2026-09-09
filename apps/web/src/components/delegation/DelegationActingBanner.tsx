import React, { useEffect } from 'react';
import { useDelegation } from '../../hooks/useDelegation';

const formatRole = (role: string) => role.replace(/_/g, ' ');

const DelegationActingBanner: React.FC = () => {
  const { activeDelegations, fetchActiveDelegations } = useDelegation();

  useEffect(() => {
    fetchActiveDelegations().catch(() => undefined);
  }, [fetchActiveDelegations]);

  if (activeDelegations.length === 0) return null;

  return (
    <div className="alert alert-warning mb-3" role="status">
      <strong>Temporary delegated authority:</strong>{' '}
      {activeDelegations.map((delegation, index) => (
        <React.Fragment key={delegation._id}>
          Acting as {delegation.scope.roles.map(formatRole).join(', ')} for {delegation.delegatorName}
          {index < activeDelegations.length - 1 ? '; ' : '.'}
        </React.Fragment>
      ))}
    </div>
  );
};

export default DelegationActingBanner;
