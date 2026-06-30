import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CountryProvider } from "./shared/contexts/CountryContext";
import Login from "./apps/login/Login";
import EmployeeDashboard from "./apps/employee/employee";
import EmployeeLeave from "./apps/employee/leave";
import EmployeeAttendance from "./apps/employee/attendance";
import EmployeeProfilePage from "./apps/employee/EmployeeProfilePage";
import OwnerDashboard from "./apps/Owner/OwnerDashboard";
import ManagerDashboard from "./apps/Manager/ManagerDashboard";
import EmployeeProfile from "./apps/Manager/EmployeeProfile";
import ManageEmployees from "./apps/Manager/ManageEmployees";
import EmployeesPage from "./apps/Manager/EmployeesPage";
import AttendancePage from "./apps/Manager/AttendancePage";
import LeavePage from "./apps/Manager/leave";
import Payroll from "./apps/Manager/Payroll";
import PlatformAdminPage from "./apps/Platform/PlatformAdminPage";
import AcceptInvitePage from "./apps/Platform/AcceptInvitePage";

const App: React.FC = () => (
  <CountryProvider>
    <Routes>
      {/* Auth */}
      <Route path="/"      element={<Login />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Platform Admin — your internal team only, role: platform_admin */}
      <Route path="/platform"      element={<PlatformAdminPage />} />

      {/* Public — invited owners land here to set name + password */}
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      {/* Manager / Admin / HR */}
      <Route path="/manager"                  element={<ManagerDashboard />} />
      <Route path="/manager/profile"          element={<EmployeeProfile />} />
      <Route path="/manager/profile/:id"      element={<EmployeeProfile />} />
      <Route path="/manager/manage-employees" element={<ManageEmployees />} />
      <Route path="/manager/employees"        element={<EmployeesPage />} />
      <Route path="/manager/attendance"       element={<AttendancePage />} />
      <Route path="/manager/leave-requests"   element={<LeavePage />} />
      <Route path="/manager/payroll"          element={<Payroll />} />

      {/* Owner */}
      <Route path="/owner/*" element={<OwnerDashboard />} />

      {/* Employee */}
      <Route path="/employee"             element={<EmployeeDashboard />} />
      <Route path="/employee/leave"       element={<EmployeeLeave />} />
      <Route path="/employee/attendance"  element={<EmployeeAttendance />} />
      <Route path="/employee/profile"     element={<EmployeeProfilePage />} />
      <Route path="/employee/performance" element={<EmployeeDashboard />} />
      <Route path="/employee/documents"   element={<EmployeeDashboard />} />
      <Route path="/employee/settings"    element={<EmployeeDashboard />} />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </CountryProvider>
);

export default App;