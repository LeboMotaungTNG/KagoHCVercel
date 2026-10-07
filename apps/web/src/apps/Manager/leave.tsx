import React from "react";
import { Calendar } from "lucide-react";
import SharedLayout from "./SharedLayout";
import { LeaveManagement } from "../../shared/components/LeaveManagement";
import { C } from "../../shared/utils/employee";
import { PageHero, PerformancePage } from "./managerUi";

const LeavePage: React.FC = () => (
  <SharedLayout title="Leave Requests">
    <PerformancePage maxWidth={1400}>
      <PageHero
        icon={<Calendar size={24} color="#fff" />}
        title="Leave Requests"
        subtitle="Approve team requests to send them to HR."
      />
      <LeaveManagement accent={C.primary} canReview reviewStage="manager" hideTitle />
    </PerformancePage>
  </SharedLayout>
);

export default LeavePage;
