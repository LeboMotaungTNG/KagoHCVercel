import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "../../shared/components/AppShell";

import { OwnerOverview } from "./OwnerOverview";
import { ManagersPage } from "./ManagersPage";
import { EmployeesPage } from "./EmployeesPage";
import { OrganizationSettingsPage } from "./OrganizationSettingsPage";
import { SubscriptionsPage } from "./SubscriptionsPage";
import OnboardingPage from "../Manager/OnboardingPage";
import OwnerLeave from "./OwnerLeave";
import ManageEmployees from "./ManageEmployees";
import EmployeeProfile from "../Manager/EmployeeProfile";
import OwnerOrganizationStructurePage from "./OrganizationStructurePage";

import FrameworkLibraryPage from "../employee/src/pages/owner/FrameworkLibraryPage";
import FrameworkBuilderPage from "../employee/src/pages/owner/FrameworkBuilderPage";
import ReviewsDashboardPage from "../employee/src/pages/owner/ReviewsDashboardPage";
import ObjectivesPage from "../employee/src/pages/owner/ObjectivesPage";
import AnalyticsInsightsPage from "../employee/src/pages/owner/AnalyticsInsightsPage";

const OwnerDashboard = () => (
  <AppShell role="owner">
    <Routes>
      <Route path="/" element={<OwnerOverview />} />
      <Route path="managers" element={<ManagersPage />} />
      <Route path="employees" element={<EmployeesPage />} />
      <Route path="manage-employees" element={<ManageEmployees embedded />} />
      <Route path="profile/:id" element={<EmployeeProfile embedded />} />
      <Route path="leave" element={<OwnerLeave />} />
      <Route path="reviews" element={<ReviewsDashboardPage />} />
      <Route path="employee-review" element={<Navigate to="/owner/reviews" replace />} />
      <Route path="frameworks" element={<FrameworkLibraryPage />} />
      <Route path="frameworks/:id/edit" element={<FrameworkBuilderPage />} />
      <Route path="objectives" element={<ObjectivesPage />} />
      <Route path="analytics" element={<AnalyticsInsightsPage mode="owner" />} />
      <Route path="organization-structure" element={<OwnerOrganizationStructurePage embedded />} />
      <Route path="organization-settings" element={<OrganizationSettingsPage />} />
      <Route path="subscriptions" element={<SubscriptionsPage />} />
      <Route path="onboarding" element={<OnboardingPage />} />
    </Routes>
  </AppShell>
);

export default OwnerDashboard;
