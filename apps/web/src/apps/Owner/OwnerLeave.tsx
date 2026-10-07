import React from "react";
import { Calendar } from "lucide-react";
import { C } from "../../shared/utils/employee";
import { LeaveManagement } from "../../shared/components/LeaveManagement";
import { PageHero, PerformancePage } from "./ownerUi";

export const OwnerLeave: React.FC = () => (
  <PerformancePage maxWidth={1400}>
    <PageHero
      icon={<Calendar size={24} color="#fff" />}
      title="Leave Management"
      subtitle="Final HR review for requests already approved by a manager."
    />
    <LeaveManagement accent={C.primary} canReview reviewStage="hr" hideTitle />
  </PerformancePage>
);

export default OwnerLeave;
