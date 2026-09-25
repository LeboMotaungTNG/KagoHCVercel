import {
  Award,
  Building2,
  Calendar,
  ClipboardList,
  Clock,
  DollarSign,
  FileSearch,
  Folder,
  Home,
  Network,
  Rocket,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AppShellNav } from "./types";

export function navForRole(role: string): AppShellNav {
  if (role === "owner") return ownerNav;
  if (role === "auditor") return auditorNav;
  if (role === "manager" || role === "admin" || role === "hr") return managerNav;
  if (role === "payroll_officer") return payrollOfficerNav;
  return employeeNav(role);
}

const employeeNav = (role: string): AppShellNav => ({
  sections: [
    {
      id: "work",
      label: "Work",
      items: [
        { kind: "link", to: "/employee", label: "Dashboard", icon: Home, exact: true },
        ...(role === "manager" || role === "line_manager"
          ? [{ kind: "link" as const, to: "/employee/team", label: "My Department", icon: Users }]
          : []),
        { kind: "link", to: "/employee/attendance", label: "Attendance", icon: Clock },
        { kind: "link", to: "/employee/leave", label: "Leave", icon: Calendar },
      ],
    },
    {
      id: "time",
      label: "Time",
      items: [
        { kind: "link", to: "/employee/overtime-request", label: "Request Overtime", icon: Clock },
        { kind: "link", to: "/employee/my-overtime", label: "My Overtime", icon: TrendingUp },
      ],
    },
    {
      id: "performance",
      label: "Performance",
      items: [
        { kind: "link", to: "/employee/performance", label: "My Performance", icon: TrendingUp },
      ],
    },
    {
      id: "account",
      label: "Account",
      items: [
        { kind: "link", to: "/employee/profile", label: "My Profile", icon: Users },
        { kind: "link", to: "/employee/documents", label: "Documents", icon: Folder },
        { kind: "link", to: "/employee/settings", label: "Settings", icon: Settings },
      ],
    },
  ],
  mobile: [
    { to: "/employee", label: "Home", icon: Home },
    { to: "/employee/attendance", label: "Attendance", icon: Clock },
    { to: "/employee/leave", label: "Leave", icon: Calendar },
    { to: "/employee/profile", label: "Profile", icon: Users },
  ],
});

const payrollOfficerNav: AppShellNav = {
  sections: [
    {
      id: "work",
      label: "Work",
      items: [
        { kind: "link", to: "/employee", label: "Dashboard", icon: Home, exact: true },
        { kind: "link", to: "/employee/attendance", label: "Attendance", icon: Clock },
        { kind: "link", to: "/employee/leave", label: "Leave", icon: Calendar },
      ],
    },
    {
      id: "time",
      label: "Time",
      items: [
        { kind: "link", to: "/employee/overtime-request", label: "Request Overtime", icon: Clock },
        { kind: "link", to: "/employee/my-overtime", label: "My Overtime", icon: TrendingUp },
        { kind: "link", to: "/employee/overtime-approvals", label: "Overtime Approvals", icon: Clock },
        { kind: "link", to: "/employee/team-overtime", label: "Team Overtime", icon: TrendingUp },
      ],
    },
    {
      id: "people",
      label: "People",
      items: [
        { kind: "link", to: "/employee/payroll", label: "Payroll", icon: DollarSign },
      ],
    },
    {
      id: "performance",
      label: "Performance",
      items: [
        { kind: "link", to: "/employee/performance", label: "My Performance", icon: TrendingUp },
      ],
    },
    {
      id: "account",
      label: "Account",
      items: [
        { kind: "link", to: "/employee/profile", label: "My Profile", icon: Users },
        { kind: "link", to: "/employee/documents", label: "Documents", icon: Folder },
        { kind: "link", to: "/employee/settings", label: "Settings", icon: Settings },
      ],
    },
  ],
  mobile: [
    { to: "/employee", label: "Home", icon: Home },
    { to: "/employee/overtime-approvals", label: "Approvals", icon: Clock },
    { to: "/employee/payroll", label: "Payroll", icon: DollarSign },
    { to: "/employee/performance", label: "Performance", icon: TrendingUp },
  ],
};

const managerNav: AppShellNav = {
  sections: [
    {
      id: "work",
      label: "Work",
      items: [
        { kind: "link", to: "/manager", label: "Dashboard", icon: Home, exact: true },
        { kind: "link", to: "/manager/attendance", label: "Attendance", icon: Calendar },
        { kind: "link", to: "/manager/leave-requests", label: "Leave Requests", icon: ClipboardList },
      ],
    },
    {
      id: "people",
      label: "People",
      items: [
        { kind: "link", to: "/manager/employees", label: "All Employees", icon: Users },
        { kind: "link", to: "/manager/profile", label: "Employee Profile", icon: Users },
        { kind: "link", to: "/delegations", label: "Delegations", icon: ShieldCheck },
      ],
    },
    {
      id: "time",
      label: "Time",
      items: [
        { kind: "link", to: "/manager/overtime-approvals", label: "Overtime Approvals", icon: Clock },
        { kind: "link", to: "/manager/team-overtime", label: "Team Overtime", icon: TrendingUp },
      ],
    },
    {
      id: "performance",
      label: "Performance",
      items: [
        {
          kind: "group",
          id: "performance",
          label: "Performance",
          icon: TrendingUp,
          children: [
            { to: "/manager/performance", label: "Team reviews", match: ["/manager/moderate"] },
            { to: "/manager/team-goals", label: "Team goals" },
            { to: "/manager/insights", label: "Insights" },
          ],
        },
      ],
    },
    {
      id: "admin",
      label: "Admin",
      items: [
        { kind: "link", to: "/manager/payroll", label: "Payroll", icon: ClipboardList },
      ],
    },
  ],
  mobile: [
    { to: "/manager", label: "Home", icon: Home },
    { to: "/manager/attendance", label: "Attendance", icon: Calendar },
    { to: "/manager/leave-requests", label: "Leave", icon: ClipboardList },
    { to: "/manager/performance", label: "Performance", icon: TrendingUp },
  ],
};

const ownerNav: AppShellNav = {
  sections: [
    {
      id: "work",
      label: "Work",
      items: [
        { kind: "link", to: "/owner", label: "Dashboard", icon: Home, exact: true },
        { kind: "link", to: "/delegations", label: "Delegations", icon: ShieldCheck },
      ],
    },
    {
      id: "people",
      label: "People",
      items: [
        {
          kind: "group",
          id: "human-capital",
          label: "Human Capital",
          icon: Users,
          children: [
            { to: "/owner/managers", label: "Managers" },
            { to: "/owner/employees", label: "Employees" },
            { to: "/owner/manage-employees", label: "Onboard Employees" },
          ],
        },
      ],
    },
    {
      id: "performance",
      label: "Performance",
      items: [
        {
          kind: "group",
          id: "performance",
          label: "Performance",
          icon: TrendingUp,
          children: [
            { to: "/owner/reviews", label: "Reviews", match: ["/owner/employee-review"] },
            { to: "/owner/frameworks", label: "Frameworks" },
            { to: "/owner/objectives", label: "Objectives" },
            { to: "/owner/analytics", label: "Analytics" },
          ],
        },
      ],
    },
    {
      id: "organisation",
      label: "Organisation",
      items: [
        { kind: "link", to: "/owner/organization-structure", label: "Organization Structure", icon: Network },
        { kind: "link", to: "/owner/organization-settings", label: "Organization Settings", icon: Building2 },
        { kind: "link", to: "/owner/onboarding", label: "Onboarding", icon: Rocket },
        { kind: "link", to: "/owner/subscriptions", label: "Subscriptions", icon: Award },
      ],
    },
  ],
  mobile: [
    { to: "/owner", label: "Home", icon: Home },
    { to: "/owner/employees", label: "People", icon: Users },
    { to: "/owner/reviews", label: "Performance", icon: TrendingUp },
    { to: "/owner/organization-settings", label: "Org", icon: Building2 },
  ],
};

const auditorNav: AppShellNav = {
  sections: [
    {
      id: "work",
      label: "Work",
      items: [
        { kind: "link", to: "/auditor", label: "Audit Logs", icon: FileSearch },
      ],
    },
  ],
  mobile: [
    { to: "/auditor", label: "Home", icon: Home },
    { to: "/auditor", label: "Logs", icon: FileSearch },
  ],
};
