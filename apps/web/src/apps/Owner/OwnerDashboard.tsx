import React, { useState } from "react";
import { Link, useNavigate, Routes, Route, useLocation } from "react-router-dom";
import {
  Users, Building2, Home, PenTool, Menu, Bell, LogOut, Award, ChevronDown, ChevronRight
} from "lucide-react";
// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

// Import pages
import { OwnerOverview } from "./OwnerOverview";
import { ManagersPage } from "./ManagersPage";
import { EmployeesPage } from "./EmployeesPage";
import { EmployeeReviewPage } from "./EmployeeReviewPage";
import { OrganizationSettingsPage } from "./OrganizationSettingsPage";
import { SubscriptionsPage } from "./SubscriptionsPage";
import OnboardingPage from "./OnboardingPage";
import OwnerLeave from "./OwnerLeave";

// --- Owner Dashboard Layout ---

const OwnerSidebar = () => {
  const [isHumanCapitalOpen, setIsHumanCapitalOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.includes('/owner/managers') || location.pathname.includes('/owner/employees')) {
      setIsHumanCapitalOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="vertical-menu" style={{ backgroundColor: "#000", top: 0, zIndex: 1005, paddingTop: "20px" }}>
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
            <li className="mm-active">
              <Link to="/owner" className="waves-effect mm-active" style={{ color: "rgba(255, 255, 255, 0.75)", display: "flex", alignItems: "center", padding: "10px 20px" }}>
                <Home size={20} style={{ marginRight: "10px" }} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <div 
                className="waves-effect" 
                style={{ color: "rgba(255, 255, 255, 0.75)", padding: "10px 20px", display: "flex", alignItems: "center", cursor: "pointer", justifyContent: "space-between" }}
                onClick={() => setIsHumanCapitalOpen(!isHumanCapitalOpen)}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Users size={20} style={{ marginRight: "10px" }} />
                  <span>Human Capital</span>
                </div>
                {isHumanCapitalOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              <ul className={`sub-menu ${isHumanCapitalOpen ? 'mm-show' : 'mm-collapse'}`} style={{ listStyle: "none", paddingLeft: "40px", margin: "5px 0", display: isHumanCapitalOpen ? "block" : "none" }}>
                <li>
                  <Link to="/owner/managers" style={{ color: "rgba(255, 255, 255, 0.6)", padding: "8px 0", display: "block", fontSize: "14px" }}>
                    Managers
                  </Link>
                </li>
                <li>
                  <Link to="/owner/employees" style={{ color: "rgba(255, 255, 255, 0.6)", padding: "8px 0", display: "block", fontSize: "14px" }}>
                    Employees
                  </Link>
                </li>
                <li>
                  <Link to="/owner/manage-employees" style={{ color: "rgba(255, 255, 255, 0.6)", padding: "8px 0", display: "block", fontSize: "14px" }}>
                    Manage Employees
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link to="/owner/employee-review" className="waves-effect" style={{ color: "rgba(255, 255, 255, 0.75)", display: "flex", alignItems: "center", padding: "10px 20px" }}>
                <PenTool size={20} style={{ marginRight: "10px" }} />
                <span>Employee Review</span>
              </Link>
            </li>
            <li>
              <Link to="/owner/organization-settings" className="waves-effect" style={{ color: "rgba(255, 255, 255, 0.75)", display: "flex", alignItems: "center", padding: "10px 20px" }}>
                <Building2 size={20} style={{ marginRight: "10px" }} />
                <span>Organization Settings</span>
              </Link>
            </li>
            <li>
              <Link to="/owner/subscriptions" className="waves-effect" style={{ color: "rgba(255, 255, 255, 0.75)", display: "flex", alignItems: "center", padding: "10px 20px" }}>
                <Award size={20} style={{ marginRight: "10px" }} />
                <span>Subscriptions</span>
              </Link>
            </li>
            <li>
              <Link to="/owner/onboarding" className="waves-effect" style={{ color: "rgba(255, 255, 255, 0.75)", display: "flex", alignItems: "center", padding: "10px 20px" }}>
                <ChevronDown size={20} style={{ marginRight: "10px" }} />
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

        <div className="d-flex">
          <div className="dropdown d-inline-block">
            <button
              type="button"
              className="btn header-item noti-icon waves-effect"
            >
              <Bell size={22} />
              <span className="noti-dot" style={{ position: "absolute", height: "6px", width: "6px", backgroundColor: "#f46a6a", borderRadius: "50%", top: "20px", right: "14px" }}></span>
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
              <Route path="leave" element={<OwnerLeave />} />
              <Route path="employee-review" element={<EmployeeReviewPage />} />
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
