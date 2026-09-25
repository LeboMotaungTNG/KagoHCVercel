import React, { useEffect, useState } from "react";
import AppShell from "../../shared/components/AppShell";
import { normalizeAppRole } from "../../shared/components/RequireAuth";

export interface SharedLayoutProps {
  title?: string;
  children: React.ReactNode;
}

function shellRole(): string {
  try {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    const role = normalizeAppRole(stored.role) || "employee";
    if (role === "payroll_officer" || role === "line_manager" || role === "manager") return role;
    return "employee";
  } catch {
    return "employee";
  }
}

const SharedLayout: React.FC<SharedLayoutProps> = ({ children, title }) => {
  const [role, setRole] = useState(shellRole);
  useEffect(() => {
    setRole(shellRole());
  }, []);
  return (
    <AppShell title={title} role={role}>
      {children}
    </AppShell>
  );
};

export default SharedLayout;
