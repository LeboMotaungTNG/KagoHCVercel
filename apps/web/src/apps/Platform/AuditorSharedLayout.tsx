import React from "react";
import AppShell from "../../shared/components/AppShell";

export interface AuditorSharedLayoutProps {
  children: React.ReactNode;
}

const AuditorSharedLayout: React.FC<AuditorSharedLayoutProps> = ({ children }) => (
  <AppShell role="auditor">{children}</AppShell>
);

export default AuditorSharedLayout;
