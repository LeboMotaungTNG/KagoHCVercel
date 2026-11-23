// Onboarding for HR and admins: the same full onboarding form the owner uses
// (personal, employment, pay and bank details → POST /employees/create-with-onboarding),
// shown inside the user's own layout and menu.
//
// It replaces the older quick-add queue here, which sent only name, email and
// department — so the server refused every employee ("Salary is required")
// while the page reported success.
import React from "react";
import AppShell from "../../shared/components/AppShell";
import OwnerManageEmployees from "../Owner/ManageEmployees";

const HrOnboardingPage: React.FC = () => (
  // No role prop: HR and admins keep their own menu.
  <AppShell title="Onboard employees">
    <OwnerManageEmployees embedded />
  </AppShell>
);

export default HrOnboardingPage;
