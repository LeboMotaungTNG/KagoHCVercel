/**
 * Manager leave page – thin wrapper around the shared LeaveManagement component
 * so the Manager and Owner dashboards stay perfectly in sync.
 */

import React from "react";
import SharedLayout from "./SharedLayout";
import { LeaveManagement } from "../../shared/components/LeaveManagement";

const LeavePage: React.FC = () => (
  <SharedLayout title="Leave Requests">
    <LeaveManagement accent="#E6A79E" canReview />
  </SharedLayout>
);

export default LeavePage;
