/**
 * Manager leave page – thin wrapper around the shared LeaveManagement component
 * so the Manager and Owner dashboards stay perfectly in sync.
 */

import React from "react";
import SharedLayout from "./SharedLayout";
import { LeaveManagement } from "../../shared/components/LeaveManagement";
import { C } from "../../shared/utils/employee";

const LeavePage: React.FC = () => (
  <SharedLayout title="Leave Requests">
    <LeaveManagement accent={C.primary} canReview />
  </SharedLayout>
);

export default LeavePage;
