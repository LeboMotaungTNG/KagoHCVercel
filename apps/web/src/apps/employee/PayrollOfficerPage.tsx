import React from "react";
import { DollarSign } from "lucide-react";
import SharedLayout from "./SharedLayout";
import { PayrollSettingsTab } from "../Owner/OrganizationSettingsPage";
import { PageHero, PerformancePage } from "./src/components/PerformanceUI";

const PayrollOfficerPage: React.FC = () => (
  <SharedLayout>
    <PerformancePage maxWidth={1200}>
      <PageHero
        icon={<DollarSign size={24} color="#fff" />}
        title="Payroll"
        subtitle="Company payroll rules used when processing pay."
      />
      <PayrollSettingsTab />
    </PerformancePage>
  </SharedLayout>
);

export default PayrollOfficerPage;
