import React from "react";
import { LeaveManagement } from "../../shared/components/LeaveManagement";

// Owner leave management – same data and actions as the Manager view,
// rendered inside the Owner dashboard layout.
export const OwnerLeave: React.FC = () => (
  <LeaveManagement accent="#4FD1C5" canReview title="Leave Management" subtitle="Home › Leave" />
);

export default OwnerLeave;
