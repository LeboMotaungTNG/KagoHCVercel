import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CountryProvider } from "./shared/contexts/CountryContext";
import RequireAuth from "./shared/components/RequireAuth";
import Login from "./apps/login/Login";
import ForgotPassword from "./apps/login/ForgotPassword";
import ResetPassword from "./apps/login/ResetPassword";
import EmployeeDashboard from "./apps/employee/employee";
import EmployeeLeave from "./apps/employee/leave";
import EmployeeAttendance from "./apps/employee/attendance";
import EmployeeProfilePage from "./apps/employee/EmployeeProfilePage";
import EmployeeSettingsPage from "./apps/employee/EmployeeSettingsPage";
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

// Convenience aliases so the route table reads cleanly.
const ManagerArea  = ["manager", "admin", "hr"] as const;
const OwnerArea    = ["owner"] as const;
const EmployeeArea = ["employee", "manager", "admin", "hr", "owner"] as const;
const PlatformArea = ["platform_admin"] as const;

const Guard: React.FC<{ roles?: readonly string[]; children: React.ReactNode }> = ({ roles, children }) => (
  <RequireAuth requireRoles={roles as any}>{children}</RequireAuth>
);

const App: React.FC = () => (
  <CountryProvider>
    <Routes>
      {/* ── Public auth pages ─────────────────────────────────────── */}
      <Route path="/"                      element={<Login />} />
      <Route path="/login"                 element={<Navigate to="/" replace />} />
      <Route path="/forgot-password"       element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/accept-invite"         element={<AcceptInvitePage />} />

      {/* ── Platform admin ────────────────────────────────────────── */}
      <Route path="/platform" element={<Guard roles={PlatformArea}><PlatformAdminPage /></Guard>} />

      {/* ── Manager / Admin / HR ──────────────────────────────────── */}
      <Route path="/manager"                  element={<Guard roles={ManagerArea}><ManagerDashboard /></Guard>} />
      <Route path="/manager/profile"          element={<Guard roles={ManagerArea}><EmployeeProfile /></Guard>} />
      <Route path="/manager/profile/:id"      element={<Guard roles={ManagerArea}><EmployeeProfile /></Guard>} />
      <Route path="/manager/manage-employees" element={<Guard roles={ManagerArea}><ManageEmployees /></Guard>} />
      <Route path="/manager/employees"        element={<Guard roles={ManagerArea}><EmployeesPage /></Guard>} />
      <Route path="/manager/attendance"       element={<Guard roles={ManagerArea}><AttendancePage /></Guard>} />
      <Route path="/manager/leave-requests"   element={<Guard roles={ManagerArea}><LeavePage /></Guard>} />
      <Route path="/manager/payroll"          element={<Guard roles={ManagerArea}><Payroll /></Guard>} />

      {/* ── Owner ─────────────────────────────────────────────────── */}
      <Route path="/owner/*" element={<Guard roles={OwnerArea}><OwnerDashboard /></Guard>} />

      {/* ── Employee self-service ─────────────────────────────────── */}
      <Route path="/employee"             element={<Guard roles={EmployeeArea}><EmployeeDashboard /></Guard>} />
      <Route path="/employee/leave"       element={<Guard roles={EmployeeArea}><EmployeeLeave /></Guard>} />
      <Route path="/employee/attendance"  element={<Guard roles={EmployeeArea}><EmployeeAttendance /></Guard>} />
      <Route path="/employee/profile"     element={<Guard roles={EmployeeArea}><EmployeeProfilePage /></Guard>} />
      <Route path="/employee/performance" element={<Guard roles={EmployeeArea}><EmployeeDashboard /></Guard>} />
      <Route path="/employee/documents"   element={<Guard roles={EmployeeArea}><EmployeeDashboard /></Guard>} />
      <Route path="/employee/settings"    element={<Guard roles={EmployeeArea}><EmployeeSettingsPage /></Guard>} />

      {/* ── Catch-all → login ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </CountryProvider>
);

export default App;
