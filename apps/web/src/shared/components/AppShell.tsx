import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LogOut, Menu } from "lucide-react";
import {
  SidebarHoverStyle,
  MobileSidebarChrome,
  sidebarItemStyle,
  sidebarSubItemStyle,
} from "./sidebarStyles";
import NotificationBell from "./NotificationBell";
import MobileBottomNav from "./MobileBottomNav";
import { C } from "../utils/employee";
import { normalizeAppRole } from "./RequireAuth";
import type { NotificationRole } from "../utils/notifications";
import DelegationActingBanner from "../../components/delegation/DelegationActingBanner";
import { navForRole } from "../nav/roleMenus";
import { groupIsActive, pathIsActive, type NavGroupItem, type NavLinkItem } from "../nav/types";
// @ts-ignore
import logoKago from "../../assets/images/logo-black-white.png";

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  /** Force a chrome variant. Defaults to the logged-in user's role. */
  role?: string;
}

const sectionTitleStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.45)",
  padding: "16px 20px 8px",
  fontSize: 11,
  textTransform: "uppercase",
  fontWeight: 600,
  letterSpacing: 0.6,
};

function readRole(): string {
  try {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    return normalizeAppRole(stored.role) || "employee";
  } catch {
    return "employee";
  }
}

function readUser(): { firstName?: string; lastName?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function notificationRoleFor(role: string): NotificationRole {
  if (role === "owner") return "owner";
  if (role === "auditor") return "auditor";
  if (role === "manager" || role === "admin" || role === "hr") return "manager";
  return "employee";
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

const AppSidebar: React.FC<{ role: string; onLogout: () => void }> = ({ role, onLogout }) => {
  const pathname = useLocation().pathname;
  const nav = navForRole(role);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    nav.sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.kind === "group" && groupIsActive(pathname, item)) next[item.id] = true;
      });
    });
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname, role]);

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderLink = (item: NavLinkItem) => {
    const active = pathIsActive(pathname, item.to, { exact: item.exact, match: item.match });
    const Icon = item.icon;
    return (
      <li key={item.to}>
        <Link to={item.to} className={active ? "sb-active" : ""} style={sidebarItemStyle(active)}>
          <Icon size={20} style={{ marginRight: 10 }} />
          <span>{item.label}</span>
        </Link>
      </li>
    );
  };

  const renderGroup = (group: NavGroupItem) => {
    const inGroup = groupIsActive(pathname, group);
    const open = openGroups[group.id] ?? inGroup;
    const Icon = group.icon;
    return (
      <li key={group.id}>
        <div
          className={`sb-group-toggle ${inGroup ? "sb-active" : ""}`}
          style={{ ...sidebarItemStyle(inGroup), justifyContent: "space-between" }}
          onClick={() => toggleGroup(group.id)}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Icon size={20} style={{ marginRight: 10 }} />
            <span>{group.label}</span>
          </div>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <ul
          className={`sub-menu ${open ? "mm-show" : "mm-collapse"}`}
          style={{
            listStyle: "none",
            padding: "4px 12px 6px 44px",
            margin: 0,
            display: open ? "block" : "none",
          }}
        >
          {group.children.map((child) => {
            const active = pathIsActive(pathname, child.to, { exact: child.exact, match: child.match });
            return (
              <li key={child.to}>
                <Link
                  to={child.to}
                  className={active ? "sb-active" : ""}
                  style={sidebarSubItemStyle(active)}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </li>
    );
  };

  return (
    <div
      className="vertical-menu kago-sidebar"
      style={{ backgroundColor: "#000", top: 0, zIndex: 1005, paddingTop: 20 }}
    >
      <SidebarHoverStyle />
      <MobileSidebarChrome onLogout={onLogout} />
      <div className="h-100" style={{ overflowY: "auto", overflowX: "hidden" }}>
        <div id="sidebar-menu">
          <div className="d-flex mb-4" style={{ padding: "0 20px" }}>
            <div style={{ width: "70%", height: "70%" }}>
              <img src={logoKago} alt="Kago HC" className="w-100 h-100" style={{ objectFit: "contain" }} />
            </div>
          </div>
          <ul className="metismenu list-unstyled mt-2" id="side-menu-item">
            {nav.sections.map((section) => (
              <React.Fragment key={section.id}>
                <li className="menu-title" style={sectionTitleStyle}>{section.label}</li>
                {section.items.map((item) =>
                  item.kind === "group" ? renderGroup(item) : renderLink(item),
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const AppHeader: React.FC<{ role: string; title?: string; onLogout: () => void }> = ({
  role,
  title,
  onLogout,
}) => {
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    setUser(readUser());
  }, []);

  const initials =
    user?.firstName || user?.lastName
      ? `${(user?.firstName?.[0] || "").toUpperCase()}${(user?.lastName?.[0] || "").toUpperCase()}`
      : "U";
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    (role === "owner" ? "Owner" : role === "auditor" ? "Auditor" : "User");

  const toggleSidebar = () => {
    const body = document.body;
    if (window.innerWidth <= 998) {
      body.classList.toggle("sidebar-enable");
    } else {
      body.classList.toggle("vertical-collpsed");
      body.classList.toggle("sidebar-enable");
    }
  };

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
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          {title ? (
            <span
              className="d-none d-md-inline"
              style={{ fontWeight: 600, fontSize: 15, color: C.ink, marginLeft: 4 }}
            >
              {title}
            </span>
          ) : null}
        </div>

        <div className="d-flex align-items-center">
          <NotificationBell
            role={notificationRoleFor(role)}
            settingsPath={
              role === "employee" || role === "payroll_officer" || role === "line_manager"
                ? "/employee/settings?section=notifications"
                : undefined
            }
          />
          <div className="dropdown d-inline-block user-dropdown">
            <button
              type="button"
              className="btn header-item waves-effect"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
              onClick={onLogout}
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

const AppFooter: React.FC = () => (
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

const AppShell: React.FC<AppShellProps> = ({ children, title, role: roleProp }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => roleProp || readRole());

  useEffect(() => {
    setRole(roleProp || readRole());
  }, [roleProp]);

  const onLogout = () => {
    clearSession();
    navigate("/login");
  };

  const nav = navForRole(role);
  const showBanner = role !== "auditor";

  return (
    <div id="layout-wrapper">
      <AppHeader role={role} title={title} onLogout={onLogout} />
      <AppSidebar role={role} onLogout={onLogout} />
      <div className="main-content">
        <div className="page-content" style={{ backgroundColor: "#f9f7f5", minHeight: "100vh" }}>
          <div className="container-fluid">
            {showBanner ? <DelegationActingBanner /> : null}
            {children}
          </div>
        </div>
      </div>
      <AppFooter />
      <MobileBottomNav
        items={nav.mobile.map((item) => ({
          to: item.to,
          label: item.label,
          icon: <item.icon size={20} />,
        }))}
      />
    </div>
  );
};

export default AppShell;
