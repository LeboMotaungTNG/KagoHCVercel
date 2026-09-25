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
      subtitle="Review requests and keep leave balances aligned across the organisation."
    />
    <LeaveManagement accent={C.primary} canReview hideTitle />
  </PerformancePage>
);

export default OwnerLeave;
