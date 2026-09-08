import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FileSearch, Home, LogOut, Menu } from "lucide-react";
import {
  sidebarItemStyle,
  SidebarHoverStyle,
  MobileSidebarChrome,
} from "../../shared/components/sidebarStyles";
import NotificationBell from "../../shared/components/NotificationBell";
import MobileBottomNav from "../../shared/components/MobileBottomNav";
import { C } from "../../shared/utils/employee";
// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

export interface AuditorSharedLayoutProps {
  children: React.ReactNode;
}

const auditorLogout = (navigate: (path: string) => void) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

const AuditorSidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const path = useLocation().pathname;
  const isActive = (p: string) => path === p || path === p + "/" || path.startsWith(p + "/");

  return (
    <div
      className="vertical-menu kago-sidebar"
      style={{ backgroundColor: "#000", top: 0, zIndex: 1005, paddingTop: "20px" }}
    >
      <SidebarHoverStyle />
      <MobileSidebarChrome onLogout={onLogout} />
      <div className="h-100" style={{ overflowY: "auto", overflowX: "hidden" }}>
        <div id="sidebar-menu">
          <div className="d-flex mb-5" style={{ padding: "0 20px" }}>
            <div style={{ width: "70%", height: "70%" }}>
              <img
                src={logoKago}
                alt="logo-picture"
                className="w-100 h-100"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
          <ul className="metismenu list-unstyled mt-2" id="side-menu-item">
            <li
              className="menu-title"
              style={{
                color: "#fff",
                padding: "12px 20px",
                fontSize: 11,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Menu
            </li>
            <li>
              <Link
                to="/auditor"
                className={isActive("/auditor") ? "sb-active" : ""}
                style={sidebarItemStyle(isActive("/auditor"))}
              >
                <FileSearch size={20} style={{ marginRight: 10 }} />
                <span>Audit Logs</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const AuditorHeader: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  const initials =
    user?.firstName || user?.lastName
      ? `${(user?.firstName?.[0] || "").toUpperCase()}${(user?.lastName?.[0] || "").toUpperCase()}`
      : "A";
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Auditor";

  function toggleSidebar() {
    const body = document.body;
    if (window.innerWidth <= 998) {
      body.classList.toggle("sidebar-enable");
    } else {
      body.classList.toggle("vertical-collpsed");
      body.classList.toggle("sidebar-enable");
    }
  }

  return (
    <header id="page-topbar">
      <div className="navbar-header">
        <div className="d-flex align-items-center">
          <div className="navbar-brand-box text-center" />
          <button
            type="button"
            className="btn btn-sm px-3 font-size-24 header-item waves-effect"
            id="vertical-menu-btn"
            onClick={toggleSidebar}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="d-flex align-items-center">
          <NotificationBell role="auditor" />
          <div className="dropdown d-inline-block user-dropdown">
            <button
              type="button"
              className="btn header-item waves-effect"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
              onClick={() => auditorLogout(navigate)}
            >
              <div
                className="rounded-circle header-profile-user"
                style={{
                  backgroundColor: C.primary,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {initials}
              </div>
              <span className="d-none d-xl-inline-block ms-1">{displayName}</span>
              <LogOut size={16} className="ms-2" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const AuditorFooter: React.FC = () => (
  <footer className="footer">
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-6">{new Date().getFullYear()} © Kago Human Capital.</div>
        <div className="col-sm-6">
          <div className="text-sm-end d-none d-sm-block">
            <span style={{ cursor: "pointer" }}>Privacy</span>
            <span style={{ margin: "0 8px" }}>|</span>
            <span style={{ cursor: "pointer" }}>Cookies</span>
            <span style={{ margin: "0 8px" }}>|</span>
            <span style={{ cursor: "pointer" }}>Terms &amp; Conditions</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

const AuditorSharedLayout: React.FC<AuditorSharedLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div id="layout-wrapper">
      <AuditorHeader />
      <AuditorSidebar onLogout={() => auditorLogout(navigate)} />
      <div className="main-content">
        <div className="page-content" style={{ backgroundColor: "#f9f7f5", minHeight: "100vh" }}>
          <div className="container-fluid">{children}</div>
        </div>
      </div>
      <AuditorFooter />
      <MobileBottomNav
        items={[
          { to: "/auditor", label: "Home", icon: <Home size={20} /> },
          { to: "/auditor", label: "Logs", icon: <FileSearch size={20} /> },
        ]}
      />
    </div>
  );
};

export default AuditorSharedLayout;
