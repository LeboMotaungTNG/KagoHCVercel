import React, { useState } from 'react';
import { useDelegation } from '../../hooks/useDelegation';
import { delegationApi } from '../../api/delegation.api';
import DelegationBadge from '../delegation/DelegationBadge';

interface LeaveApprovalProps {
  leaveRequest: any;
}

const LeaveApproval: React.FC<LeaveApprovalProps> = ({ leaveRequest }) => {
  const { canApproveOnBehalfOf } = useDelegation();
  const [approveOnBehalfOf, setApproveOnBehalfOf] = useState(false);
  const [pending, setPending] = useState(false);

  const hasDelegatedAuthority = canApproveOnBehalfOf(leaveRequest?.delegatorId);
  const onBehalfOf = approveOnBehalfOf ? leaveRequest?.delegatorId : undefined;

  const approve = async () => {
    if (!leaveRequest?._id) return;
    setPending(true);
    try {
      await delegationApi.approveLeave(leaveRequest._id, onBehalfOf);
    } finally {
      setPending(false);
    }
  };

  const reject = async () => {
    if (!leaveRequest?._id) return;
    const reason = window.prompt('Rejection reason (required):');
    if (!reason?.trim()) return;
    setPending(true);
    try {
      await delegationApi.rejectLeave(leaveRequest._id, reason.trim(), onBehalfOf);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="leave-approval">
      {leaveRequest?.delegatorId && <DelegationBadge delegatorId={leaveRequest.delegatorId} />}

      {hasDelegatedAuthority && (
        <div className="delegation-option">
          <label>
            <input
              type="checkbox"
              checked={approveOnBehalfOf}
              onChange={(e) => setApproveOnBehalfOf(e.target.checked)}
            />
            Approve on behalf of {leaveRequest?.delegatorName}
          </label>
          <small className="text-muted d-block">You have temporary authority to approve this request</small>
        </div>
      )}

      <div className="approval-buttons">
        <button
          className="btn btn-success"
          onClick={approve}
          disabled={pending || (!hasDelegatedAuthority && !leaveRequest?.isApprover)}
        >
          ✅ Approve
        </button>
        <button
          className="btn btn-danger"
          onClick={reject}
          disabled={pending || (!hasDelegatedAuthority && !leaveRequest?.isApprover)}
        >
          ❌ Reject
        </button>
      </div>

      {!hasDelegatedAuthority && !leaveRequest?.isApprover && (
        <div className="authority-warning text-danger">⚠️ You don't have authority to approve this request</div>
      )}
    </div>
  );
};

export default LeaveApproval;
