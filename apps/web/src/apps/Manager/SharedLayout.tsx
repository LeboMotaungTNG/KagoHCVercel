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
  ListChecks,
  ClipboardList,
  Menu,
  Bell,
  LogOut,
} from "lucide-react";
import { performLogout } from "../../shared/utils/session-manager";
// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

export interface SharedLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const ManagerSidebar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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

            <li className={isActive("/manager") ? "mm-active" : ""}>
              <Link
                to="/manager"
                className="waves-effect"
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

            <li className={isActive("/manager/profile") ? "mm-active" : ""}>
              <Link
                to="/manager/profile"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Users size={20} style={{ marginRight: "10px" }} />
                <span>Employee Profile</span>
              </Link>
            </li>

            <li className={isActive("/manager/manage-employees") ? "mm-active" : ""}>
              <Link
                to="/manager/manage-employees"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <ListChecks size={20} style={{ marginRight: "10px" }} />
                <span>Manage Employees</span>
              </Link>
            </li>

            <li className={isActive("/manager/employees") ? "mm-active" : ""}>
              <Link
                to="/manager/employees"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Users size={20} style={{ marginRight: "10px" }} />
                <span>All Employees</span>
              </Link>
            </li>

            <li className={isActive("/manager/attendance") ? "mm-active" : ""}>
              <Link
                to="/manager/attendance"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Calendar size={20} style={{ marginRight: "10px" }} />
                <span>Attendance</span>
              </Link>
            </li>

            <li className={isActive("/manager/leave-requests") ? "mm-active" : ""}>
              <Link
                to="/manager/leave-requests"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <ClipboardList size={20} style={{ marginRight: "10px" }} />
                <span>Leave Requests</span>
              </Link>
            </li>

            <li className={isActive("/manager/payroll") ? "mm-active" : ""}>
              <Link
                to="/manager/payroll"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <ClipboardList size={20} style={{ marginRight: "10px" }} />
                <span>Payroll Management</span>
              </Link>
            </li>
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
              onClick={() => performLogout(navigate)}
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

const SharedLayout: React.FC<SharedLayoutProps> = ({ children }) => (
  <div id="layout-wrapper">
    <ManagerHeader />
    <ManagerSidebar />
    <div className="main-content">
      <div
        className="page-content"
        style={{ backgroundColor: "#f9f7f5", minHeight: "100vh" }}
      >
        <div className="container-fluid">{children}</div>
      </div>
    </div>
    <ManagerFooter />
  </div>
);

export default SharedLayout;
