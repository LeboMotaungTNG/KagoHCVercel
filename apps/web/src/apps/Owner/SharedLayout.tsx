import React from "react";
import AppShell from "../../shared/components/AppShell";

export interface SharedLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const SharedLayout: React.FC<SharedLayoutProps> = ({ children, title }) => (
  <AppShell title={title} role="owner">{children}</AppShell>
);

export default SharedLayout;
