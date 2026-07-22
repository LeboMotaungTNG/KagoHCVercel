/**
 * SharedLayout – common Manager shell.
 *
 * Recreates the Owner dashboard chrome (sidebar, header, footer)
 * for all Manager pages so they share a consistent look and
 * navigation experience.
 */
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  TrendingUp,
  Menu,
  LogOut,
} from "lucide-react";
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

export interface SharedLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const ManagerSidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const items: { to: string; label: string; icon: React.ReactNode }[] = [
    { to: "/manager",                  label: "Dashboard",          icon: <Home size={20} style={{ marginRight: 10 }} /> },
    { to: "/manager/profile",          label: "Employee Profile",   icon: <Users size={20} style={{ marginRight: 10 }} /> },
    { to: "/manager/employees",        label: "All Employees",      icon: <Users size={20} style={{ marginRight: 10 }} /> },
    { to: "/manager/attendance",       label: "Attendance",         icon: <Calendar size={20} style={{ marginRight: 10 }} /> },
    { to: "/manager/leave-requests",   label: "Leave Requests",     icon: <ClipboardList size={20} style={{ marginRight: 10 }} /> },
    { to: "/manager/performance",      label: "Performance",        icon: <TrendingUp size={20} style={{ marginRight: 10 }} /> },
    { to: "/manager/team-goals",       label: "Team Goals",         icon: <ClipboardList size={20} style={{ marginRight: 10 }} /> },
    { to: "/manager/payroll",          label: "Payroll Management", icon: <ClipboardList size={20} style={{ marginRight: 10 }} /> },
  ];

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
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Menu
            </li>

            {items.map(item => {
              const active = item.to === "/manager"
                ? location.pathname === "/manager" || location.pathname === "/manager/"
                : isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={active ? "sb-active" : ""}
                    style={sidebarItemStyle(active)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ManagerHeader: React.FC = () => {
  const navigate = useNavigate();

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
          <NotificationBell role="manager" />

          <div className="dropdown d-inline-block user-dropdown">
            <button
              type="button"
              className="btn header-item waves-effect"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate("/login");
              }}
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
                M
              </div>
              <span className="d-none d-xl-inline-block ms-1">Manager</span>
              <LogOut size={16} className="ms-2" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const ManagerFooter: React.FC = () => (
  <footer className="footer">
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-6">
          {new Date().getFullYear()} &copy; Kago Human Capital.
        </div>
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

const SharedLayout: React.FC<SharedLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate("/login");
  };
  return (
  <div id="layout-wrapper">
    <ManagerHeader />
    <ManagerSidebar onLogout={handleLogout} />
    <div className="main-content">
      <div
        className="page-content"
        style={{ backgroundColor: "#f9f7f5", minHeight: "100vh" }}
      >
        <div className="container-fluid">{children}</div>
      </div>
    </div>
    <ManagerFooter />
    <MobileBottomNav
      items={[
        { to: "/manager",                label: "Home",       icon: <Home size={20} /> },
        { to: "/manager/attendance",     label: "Attendance", icon: <Calendar size={20} /> },
        { to: "/manager/leave-requests", label: "Leave",      icon: <ClipboardList size={20} /> },
        { to: "/manager/employees",      label: "Team",       icon: <Users size={20} /> },
      ]}
    />
  </div>
  );
};

export default SharedLayout;
 
