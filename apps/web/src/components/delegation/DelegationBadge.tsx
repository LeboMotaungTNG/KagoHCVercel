import React from 'react';
import { useDelegation } from '../../hooks/useDelegation';

interface DelegationBadgeProps {
  delegatorId: string;
}

const DelegationBadge: React.FC<DelegationBadgeProps> = ({ delegatorId }) => {
  const { getActiveDelegationForDelegator } = useDelegation();
  const delegation = getActiveDelegationForDelegator(delegatorId);

  if (!delegation) return null;

  return (
    <span className="delegation-badge" title={`On behalf of ${delegation.delegatorName}`}>
      <span className="badge bg-warning text-dark">👤 On behalf of {delegation.delegatorName}</span>
    </span>
  );
};

export default DelegationBadge;
