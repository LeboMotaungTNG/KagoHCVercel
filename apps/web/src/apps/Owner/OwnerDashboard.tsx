import React, { useState } from "react";

import {
  Link,
  useNavigate,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import {
  Users,
  Building2,
  Home,
  Menu,
  LogOut,
  Award,
  ChevronDown,
  ChevronRight,
  Rocket,
  TrendingUp,
  Network,
} from "lucide-react";

import {
  sidebarItemStyle,
  sidebarSubItemStyle,
  SidebarHoverStyle,
} from "../../shared/components/sidebarStyles";

import NotificationBell from "../../shared/components/NotificationBell";

// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

// Owner pages
import { OwnerOverview } from "./OwnerOverview";
import { ManagersPage } from "./ManagersPage";
import { EmployeesPage } from "./EmployeesPage";
import { OrganizationSettingsPage } from "./OrganizationSettingsPage";
import { SubscriptionsPage } from "./SubscriptionsPage";
import OnboardingPage from "../Manager/OnboardingPage";
import OwnerLeave from "./OwnerLeave";
import ManageEmployees from "./ManageEmployees";
import EmployeeProfile from "../Manager/EmployeeProfile";
import OwnerOrganizationStructurePage from "./OrganizationStructurePage"; 

// Performance pages
import FrameworkLibraryPage from "../employee/src/pages/owner/FrameworkLibraryPage";
import FrameworkBuilderPage from "../employee/src/pages/owner/FrameworkBuilderPage";
import ReviewsDashboardPage from "../employee/src/pages/owner/ReviewsDashboardPage";
import ObjectivesPage from "../employee/src/pages/owner/ObjectivesPage";
import AnalyticsInsightsPage from "../employee/src/pages/owner/AnalyticsInsightsPage";



// --- Owner Dashboard Layout ---

const OwnerSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const isExact   = (p: string) => path === p || path === p + "/";
  const isInGroup = (...paths: string[]) => paths.some(p => path === p || path.startsWith(p + "/"));

  const hcSubPaths = ["/owner/managers", "/owner/employees", "/owner/manage-employees"];
  const inHumanCapital = isInGroup(...hcSubPaths);


  const perfSubPaths = [
    "/owner/reviews",
    "/owner/employee-review",
    "/owner/frameworks",
    "/owner/objectives",
    "/owner/analytics",


  ];
  const inPerformance = isInGroup(...perfSubPaths);

  // Sub-menu is open whenever the user is on one of the HC pages OR they
  // have manually expanded it.
  const [isHumanCapitalOpen, setIsHumanCapitalOpen] = useState<boolean>(inHumanCapital);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState<boolean>(inPerformance);

  React.useEffect(() => {
    if (inHumanCapital) setIsHumanCapitalOpen(true);
  }, [inHumanCapital]);

  React.useEffect(() => {
    if (inPerformance) setIsPerformanceOpen(true);
  }, [inPerformance]);

  return (
    <div className="vertical-menu kago-sidebar" style={{ backgroundColor: "#000", top: 0, zIndex: 1005, paddingTop: "20px" }}>
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
            <li className="menu-title" style={{ color: "#fff", padding: "12px 20px", fontSize: "11px", textTransform: "uppercase", fontWeight: "600" }}>
              Menu
            </li>

            {/* Dashboard */}
            <li>
              <Link to="/owner"
                className={isExact("/owner") ? "sb-active" : ""}
                style={sidebarItemStyle(isExact("/owner"))}
              >
                <Home size={20} style={{ marginRight: "10px" }} />
                <span>Dashboard</span>
              </Link>
            </li>

            {/* Human Capital (collapsible group) */}
            <li>
              <div
                className={`sb-group-toggle ${inHumanCapital ? "sb-active" : ""}`}
                style={{ ...sidebarItemStyle(inHumanCapital), justifyContent: "space-between" }}
                onClick={() => setIsHumanCapitalOpen(o => !o)}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Users size={20} style={{ marginRight: "10px" }} />
                  <span>Human Capital</span>
                </div>
                {isHumanCapitalOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              <ul
                className={`sub-menu ${isHumanCapitalOpen ? "mm-show" : "mm-collapse"}`}
                style={{
                  listStyle: "none",
                  padding: "4px 12px 6px 44px",
                  margin: 0,
                  display: isHumanCapitalOpen ? "block" : "none",
                }}
              >
                <li>
                  <Link to="/owner/managers"
                    className={isExact("/owner/managers") ? "sb-active" : ""}
                    style={sidebarSubItemStyle(isExact("/owner/managers"))}
                  >
                    Managers
                  </Link>
                </li>
                <li>
                  <Link to="/owner/employees"
                    className={isExact("/owner/employees") ? "sb-active" : ""}
                    style={sidebarSubItemStyle(isExact("/owner/employees"))}
                  >
                    Employees
                  </Link>
                </li>
                <li>
                  <Link to="/owner/manage-employees"
                    className={isExact("/owner/manage-employees") ? "sb-active" : ""}
                    style={sidebarSubItemStyle(isExact("/owner/manage-employees"))}
                  >
                    Manage Employees
                  </Link>
                </li>
              </ul>
            </li>

            {/* Performance (collapsible group) */}
            <li>
              <div
                className={`sb-group-toggle ${inPerformance ? "sb-active" : ""}`}
                style={{ ...sidebarItemStyle(inPerformance), justifyContent: "space-between" }}
                onClick={() => setIsPerformanceOpen(o => !o)}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <TrendingUp size={20} style={{ marginRight: "10px" }} />
                  <span>Performance</span>
                </div>
                {isPerformanceOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              <ul
                className={`sub-menu ${isPerformanceOpen ? "mm-show" : "mm-collapse"}`}
                style={{
                  listStyle: "none",
                  padding: "4px 12px 6px 44px",
                  margin: 0,
                  display: isPerformanceOpen ? "block" : "none",
                }}
              >
                <li>
                  <Link to="/owner/reviews"
                    className={isExact("/owner/reviews") || isExact("/owner/employee-review") ? "sb-active" : ""}
                    style={sidebarSubItemStyle(isExact("/owner/reviews") || isExact("/owner/employee-review"))}
                  >
                    Reviews
                  </Link>
                </li>
                <li>
                  <Link to="/owner/frameworks"
                    className={isInGroup("/owner/frameworks") ? "sb-active" : ""}
                    style={sidebarSubItemStyle(isInGroup("/owner/frameworks"))}
                  >
                    Frameworks
                  </Link>
                </li>
                <li>
                  <Link to="/owner/objectives"
                    className={isExact("/owner/objectives") ? "sb-active" : ""}
                    style={sidebarSubItemStyle(isExact("/owner/objectives"))}
                  >
                    Objectives
                  </Link>
                </li>
                <li>
                  <Link to="/owner/analytics"
                    className={isExact("/owner/analytics") ? "sb-active" : ""}
                    style={sidebarSubItemStyle(isExact("/owner/analytics"))}
                  >
                    Analytics
                  </Link>
                </li>
              </ul>
            </li>

            {/* Organization Structure */}
            <li>
              <Link to="/owner/organization-structure"
                className={isExact("/owner/organization-structure") ? "sb-active" : ""}
                style={sidebarItemStyle(isExact("/owner/organization-structure"))}
              >
                <Network size={20} style={{ marginRight: "10px" }} />
                <span>Organization Structure</span>
              </Link>
            </li>

            {/* Organization Settings */}
            <li>
              <Link to="/owner/organization-settings"
                className={isExact("/owner/organization-settings") ? "sb-active" : ""}
                style={sidebarItemStyle(isExact("/owner/organization-settings"))}
              >
                <Building2 size={20} style={{ marginRight: "10px" }} />
                <span>Organization Settings</span>
              </Link>
            </li>

            {/* Subscriptions */}
            <li>
              <Link to="/owner/subscriptions"
                className={isExact("/owner/subscriptions") ? "sb-active" : ""}
                style={sidebarItemStyle(isExact("/owner/subscriptions"))}
              >
                <Award size={20} style={{ marginRight: "10px" }} />
                <span>Subscriptions</span>
              </Link>
            </li>

            {/* Onboarding — rocket icon (launch / get started) */}
            <li>
              <Link to="/owner/onboarding"
                className={isExact("/owner/onboarding") ? "sb-active" : ""}
                style={sidebarItemStyle(isExact("/owner/onboarding"))}
              >
                <Rocket size={20} style={{ marginRight: "10px" }} />
                <span>Onboarding</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const OwnerHeader = () => {
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
          <div className="navbar-brand-box text-center">
            {/* Blank space to push the toggle button to the right, behind the sidebar */}
          </div>
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
          <NotificationBell role="owner" />

          <div className="dropdown d-inline-block user-dropdown">
            <button
              type="button"
              className="btn header-item waves-effect"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
              onClick={() => navigate("/login")}
            >
              <div 
                className="rounded-circle header-profile-user" 
                style={{ backgroundColor: "#4FD1C5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
              >
                A
              </div>
              <span className="d-none d-xl-inline-block ms-1">Admin</span>
              <LogOut size={16} className="ms-2" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const OwnerFooter = () => {
  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-6">{new Date().getFullYear()} © Kago Human Capital.</div>
          <div className="col-sm-6">
            <div className="text-sm-end d-none d-sm-block">
              <span style={{ cursor: "pointer" }}>Privacy</span> <span style={{ margin: "0 8px" }}>|</span>
              <span style={{ cursor: "pointer" }}>Cookies</span> <span style={{ margin: "0 8px" }}>|</span>
              <span style={{ cursor: "pointer" }}>Terms & Conditions</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const OwnerDashboard = () => {
  return (
    <div id="layout-wrapper">
      <OwnerHeader />
      <OwnerSidebar />
      
      <div className="main-content">
        <div className="page-content" style={{ backgroundColor: "#f9f7f5", minHeight: "100vh" }}>
          <div className="container-fluid">
            <Routes>
              <Route path="/" element={<OwnerOverview />} />
              <Route path="managers" element={<ManagersPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="manage-employees" element={<ManageEmployees embedded />} />
              <Route path="profile/:id" element={<EmployeeProfile embedded />} />
              <Route path="leave" element={<OwnerLeave />} />
              <Route path="reviews" element={<ReviewsDashboardPage />} />
              <Route path="employee-review" element={<Navigate to="/owner/reviews" replace />} />
              <Route path="frameworks" element={<FrameworkLibraryPage />} />
              <Route path="frameworks/:id/edit" element={<FrameworkBuilderPage />} />
              <Route path="objectives" element={<ObjectivesPage />} />
              <Route path="analytics" element={<AnalyticsInsightsPage mode="owner" />} />
              <Route path="organization-structure" element={<OwnerOrganizationStructurePage embedded />} />
              <Route path="organization-settings" element={<OrganizationSettingsPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
        
            </Routes>
          </div>
        </div>
      </div>
      <OwnerFooter />
    </div>
  );
};

export default OwnerDashboard;
