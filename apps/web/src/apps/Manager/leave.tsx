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
        subtitle="Review, approve, and keep team leave on track."
      />
      <LeaveManagement accent={C.primary} canReview hideTitle />
    </PerformancePage>
  </SharedLayout>
);

export default LeavePage;
