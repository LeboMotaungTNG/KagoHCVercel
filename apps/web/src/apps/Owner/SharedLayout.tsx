
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  PenTool,
  Building2,
  Award,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  SidebarHoverStyle,
  MobileSidebarChrome,
} from "../../shared/components/sidebarStyles";
import NotificationBell from "../../shared/components/NotificationBell";
import MobileBottomNav from "../../shared/components/MobileBottomNav";
// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

const ownerLogout = (navigate: (path: string) => void) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

export interface SharedLayoutProps {
  title?: string;
  children: React.ReactNode;
}

const OwnerSidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [isHumanCapitalOpen, setIsHumanCapitalOpen] = React.useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  React.useEffect(() => {
    if (
      location.pathname.includes("/owner/managers") ||
      location.pathname.includes("/owner/employees") ||
      location.pathname.includes("/owner/manage-employees")
    ) {
      setIsHumanCapitalOpen(true);
    }
  }, [location.pathname]);

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

            <li className={isActive("/owner") ? "mm-active" : ""}>
              <Link
                to="/owner"
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

            <li>
              <div
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  padding: "10px 20px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  justifyContent: "space-between",
                }}
                onClick={() => setIsHumanCapitalOpen(!isHumanCapitalOpen)}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Users size={20} style={{ marginRight: "10px" }} />
                  <span>Human Capital</span>
                </div>
                {isHumanCapitalOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </div>
              <ul
                className={`sub-menu ${
                  isHumanCapitalOpen ? "mm-show" : "mm-collapse"
                }`}
                style={{
                  listStyle: "none",
                  paddingLeft: "40px",
                  margin: "5px 0",
                  display: isHumanCapitalOpen ? "block" : "none",
                }}
              >
                <li>
                  <Link
                    to="/owner/managers"
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      padding: "8px 0",
                      display: "block",
                      fontSize: "14px",
                    }}
                  >
                    Managers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/owner/employees"
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      padding: "8px 0",
                      display: "block",
                      fontSize: "14px",
                    }}
                  >
                    Employees
                  </Link>
                </li>
                <li>
                  <Link
                    to="/owner/manage-employees"
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      padding: "8px 0",
                      display: "block",
                      fontSize: "14px",
                    }}
                  >
                    Manage Employees
                  </Link>
                </li>
              </ul>
            </li>

            <li className={isActive("/owner/reviews") || isActive("/owner/employee-review") ? "mm-active" : ""}>
              <Link
                to="/owner/reviews"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <PenTool size={20} style={{ marginRight: "10px" }} />
                <span>Employee Review</span>
              </Link>
            </li>

            <li className={isActive("/owner/organization-settings") ? "mm-active" : ""}>
              <Link
                to="/owner/organization-settings"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Building2 size={20} style={{ marginRight: "10px" }} />
                <span>Organization Settings</span>
              </Link>
            </li>

            <li className={isActive("/owner/subscriptions") ? "mm-active" : ""}>
              <Link
                to="/owner/subscriptions"
                className="waves-effect"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                }}
              >
                <Award size={20} style={{ marginRight: "10px" }} />
                <span>Subscriptions</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const OwnerHeader: React.FC = () => {
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
          <NotificationBell role="owner" />

          <div className="dropdown d-inline-block user-dropdown">
            <button
              type="button"
              className="btn header-item waves-effect"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
              }}
            >
              <div
                className="rounded-circle header-profile-user"
                style={{
                  backgroundColor: "#5B8DEF",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                O
              </div>
              <span className="d-none d-xl-inline-block ms-1">Owner</span>
              <LogOut size={16} className="ms-2" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const OwnerFooter: React.FC = () => (
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
  const handleLogout = () => ownerLogout(navigate);
  return (
  <div id="layout-wrapper">
    <OwnerHeader />
    <OwnerSidebar onLogout={handleLogout} />
    <div className="main-content">
      <div
        className="page-content"
        style={{ backgroundColor: "#f9f7f5", minHeight: "100vh" }}
      >
        <div className="container-fluid">{children}</div>
      </div>
    </div>
    <OwnerFooter />
    <MobileBottomNav
      items={[
        { to: "/owner",                       label: "Home",     icon: <Home size={20} /> },
        { to: "/owner/employees",             label: "People",   icon: <Users size={20} /> },
        { to: "/owner/reviews",                 label: "Reviews",  icon: <PenTool size={20} /> },
        { to: "/owner/organization-settings", label: "Org",      icon: <Building2 size={20} /> },
      ]}
    />
  </div>
  );
};

export default SharedLayout;
