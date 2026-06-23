import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Folder,
  Clock,
  TrendingUp,
  Settings,
  Menu,
  Bell,
  LogOut,
} from "lucide-react";
import {
  sidebarItemStyle,
  SidebarHoverStyle,
} from "../../shared/components/sidebarStyles";
// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

export interface SharedLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const EmployeeSidebar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/employee") {
      return location.pathname === "/employee" || location.pathname === "/employee/";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const menuTitleStyle: React.CSSProperties = {
    color: "#fff",
    padding: "12px 20px",
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: 600,
  };

  const main: { to: string; label: string; icon: React.ReactNode }[] = [
    { to: "/employee",            label: "Dashboard",        icon: <Home size={20} style={{ marginRight: 10 }} /> },
    { to: "/employee/profile",    label: "My Profile",       icon: <Users size={20} style={{ marginRight: 10 }} /> },
    { to: "/employee/leave",      label: "Leave Management", icon: <Calendar size={20} style={{ marginRight: 10 }} /> },
    { to: "/employee/attendance", label: "Attendance",       icon: <Clock size={20} style={{ marginRight: 10 }} /> },
    { to: "/employee/performance",label: "Performance",      icon: <TrendingUp size={20} style={{ marginRight: 10 }} /> },
    { to: "/employee/documents",  label: "Documents",        icon: <Folder size={20} style={{ marginRight: 10 }} /> },
  ];

  return (
    <div
      className="vertical-menu kago-sidebar"
      style={{ backgroundColor: "#000", top: 0, zIndex: 1005, paddingTop: "20px" }}
    >
      <SidebarHoverStyle />
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
            <li className="menu-title" style={menuTitleStyle}>Menu</li>

            {main.map(item => {
              const active = isActive(item.to);
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

            <li className="menu-title" style={{ ...menuTitleStyle, marginTop: 16 }}>Others</li>

            <li>
              <Link
                to="/employee/settings"
                className={isActive("/employee/settings") ? "sb-active" : ""}
                style={sidebarItemStyle(isActive("/employee/settings"))}
              >
                <Settings size={20} style={{ marginRight: 10 }} />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const EmployeeHeader: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    }
  }, []);

  const initials =
    user?.firstName || user?.lastName
      ? `${(user?.firstName?.[0] || "").toUpperCase()}${(user?.lastName?.[0] || "").toUpperCase()}`
      : "U";
  const displayName = user?.firstName || user?.lastName ? user?.firstName || user?.lastName : "User";

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

        <div className="d-flex">
          <div className="dropdown d-inline-block">
            <button
              type="button"
              className="btn header-item noti-icon waves-effect"
            >
              <Bell size={22} />
              <span
                className="noti-dot"
                style={{
                  position: "absolute",
                  height: "6px",
                  width: "6px",
                  backgroundColor: "#f46a6a",
                  borderRadius: "50%",
                  top: "20px",
                  right: "14px",
                }}
              />
            </button>
          </div>

          <div className="dropdown d-inline-block user-dropdown">
            <button
              type="button"
              className="btn header-item waves-effect"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
              onClick={() => navigate("/login")}
            >
              <div
                className="rounded-circle header-profile-user"
                style={{
                  backgroundColor: "#E6A79E",
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

const EmployeeFooter: React.FC = () => (
  <footer className="footer">
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-6">
          {new Date().getFullYear()} © Kago Human Capital.
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

const SharedLayout: React.FC<SharedLayoutProps> = ({ children }) => (
  <div id="layout-wrapper">
    <EmployeeHeader />
    <EmployeeSidebar />
    <div className="main-content">
      <div
        className="page-content"
        style={{ backgroundColor: "#f9f7f5", minHeight: "100vh" }}
      >
        <div className="container-fluid">{children}</div>
      </div>
    </div>
    <EmployeeFooter />
  </div>
);

export default SharedLayout;

