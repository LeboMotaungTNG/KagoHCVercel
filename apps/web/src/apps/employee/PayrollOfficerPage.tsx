import React from "react";
import SharedLayout from "./SharedLayout";
import { PayrollSettingsTab } from "../Owner/OrganizationSettingsPage";

const PayrollOfficerPage: React.FC = () => (
  <SharedLayout>
    <PayrollSettingsTab />
  </SharedLayout>
);

export default PayrollOfficerPage;