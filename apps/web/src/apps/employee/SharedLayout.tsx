import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

export interface SharedLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const EmployeeSidebar: React.FC = () => {
  return (
    <div
      className="vertical-menu"
      style={{ backgroundColor: "#000", top: 0, zIndex: 1005, paddingTop: "20px" }}
    >
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
            <li className="mm-active">
              <Link
                to="/employee"
                className="waves-effect mm-active"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Home size={20} style={{ marginRight: "10px" }} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/employee/profile"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Users size={20} style={{ marginRight: "10px" }} />
                <span>My Profile</span>
              </Link>
            </li>
            <li>
              <Link
                to="/employee/leave"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Calendar size={20} style={{ marginRight: "10px" }} />
                <span>Leave Management</span>
              </Link>
            </li>
            <li>
              <Link
                to="/employee/attendance"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Clock size={20} style={{ marginRight: "10px" }} />
                <span>Attendance</span>
              </Link>
            </li>
            <li>
              <Link
                to="/employee/performance"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <TrendingUp size={20} style={{ marginRight: "10px" }} />
                <span>Performance</span>
              </Link>
            </li>
            <li>
              <Link
                to="/employee/documents"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Folder size={20} style={{ marginRight: "10px" }} />
                <span>Documents</span>
              </Link>
            </li>
            <li
              className="menu-title"
              style={{
                color: "#fff",
                padding: "12px 20px",
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: 600,
                marginTop: "16px",
              }}
            >
              Others
            </li>
            <li>
              <Link
                to="/employee/settings"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Settings size={20} style={{ marginRight: "10px" }} />
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

