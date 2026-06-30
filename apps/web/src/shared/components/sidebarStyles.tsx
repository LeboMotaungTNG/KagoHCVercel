import React from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";

/**
 * Shared sidebar style helpers.
 *
 * Used by Owner / Manager / Employee SharedLayouts so all dashboards
 * share the same active-tab highlight and hover behaviour.
 *
 * Behaviour:
 *  - Active items get a persistent brand-blue tint, a 3 px left rail
 *    and brighter white text.
 *  - Inactive items get a soft hover, but the active item's highlight
 *    always wins (the `.sb-active` CSS class is excluded from the
 *    `:hover` rule) so the "hover-look" stays on the open tab.
 */

export const SIDEBAR_ACCENT = "#33A6CD";

export const sidebarItemStyle = (active: boolean): React.CSSProperties => ({
  color: active ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
  display: "flex",
  alignItems: "center",
  padding: "10px 20px",
  cursor: "pointer",
  background: active ? "rgba(51, 166, 205, 0.18)" : "transparent",
  borderLeft: `3px solid ${active ? SIDEBAR_ACCENT : "transparent"}`,
  paddingLeft: active ? 17 : 20,
  fontWeight: active ? 600 : 400,
  textDecoration: "none",
  transition: "background-color .15s ease, color .15s ease, border-color .15s ease",
});

export const sidebarSubItemStyle = (active: boolean): React.CSSProperties => ({
  color: active ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
  padding: "8px 12px",
  display: "block",
  fontSize: 14,
  borderRadius: 6,
  background: active ? "rgba(51, 166, 205, 0.18)" : "transparent",
  fontWeight: active ? 600 : 400,
  textDecoration: "none",
  transition: "background-color .15s ease, color .15s ease",
});

/**
 * Drop this once at the top of any sidebar to enable consistent hover
 * styling without overriding the active item's highlight.
 *
 * Usage:
 *   <SidebarHoverStyle />
 *
 * The selector targets anything inside `.kago-sidebar`, so wrap the
 * sidebar root with `className="kago-sidebar"`.
 */
export const SidebarHoverStyle: React.FC = () => (
  <style>{`
    .kago-sidebar a, .kago-sidebar .sb-group-toggle {
      text-decoration: none;
    }
    .kago-sidebar a:hover:not(.sb-active),
    .kago-sidebar .sb-group-toggle:hover:not(.sb-active) {
      background: rgba(255,255,255,0.06);
      color: #ffffff !important;
    }

    /* Sidebar close button + bottom logout — only shown on mobile (<=992px). */
    .kago-sidebar-close,
    .kago-sidebar-mobile-logout {
      display: none;
    }
    .kago-sidebar-backdrop {
      display: none;
    }

    /* Hide the inner scrollbar inside the sidebar — it scrolls when needed
       but the scrollbar gutter shouldn't draw a visual rail. */
    .kago-sidebar .h-100,
    .vertical-menu .h-100 {
      scrollbar-width: none;          /* Firefox */
      -ms-overflow-style: none;       /* Old Edge / IE */
    }
    .kago-sidebar .h-100::-webkit-scrollbar,
    .vertical-menu .h-100::-webkit-scrollbar {
      width: 0;
      height: 0;
      display: none;                  /* Chrome / Safari */
    }

    @media (max-width: 992px) {
      /* On mobile the sidebar should slide in over the topbar but allow
         the user to dismiss it. */
      .vertical-menu {
        width: 82vw !important;
        max-width: 300px;
        z-index: 1060 !important;
        top: 0 !important;
        height: 100vh;
        box-shadow: 2px 0 12px rgba(0,0,0,0.25);
        /* Suppress any outer scrollbar from the drawer wrapper too. */
        overflow: hidden;
      }

      .kago-sidebar-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 12px;
        right: 12px;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background: rgba(255,255,255,0.10);
        color: #fff;
        border: 0;
        z-index: 2;
        cursor: pointer;
      }
      .kago-sidebar-close:hover {
        background: rgba(255,255,255,0.18);
      }

      .kago-sidebar-mobile-logout {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(180deg, #1a0608 0%, #2a0c0f 100%);
        color: #ffb3b3;
        border: 0;
        border-top: 1px solid rgba(255,255,255,0.10);
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        z-index: 2;
      }
      .kago-sidebar-mobile-logout:hover {
        background: linear-gradient(180deg, #260a0c 0%, #3a1015 100%);
        color: #ffffff;
      }

      body.sidebar-enable .kago-sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        z-index: 1055;
      }

      /* Don't double up — the dedicated backdrop replaces the box-shadow one
         from _mobile.scss. */
      body.sidebar-enable .vertical-menu {
        box-shadow: 2px 0 12px rgba(0,0,0,0.25) !important;
      }

      /* Reserve space at the bottom so the absolute logout button doesn't
         hide the last menu item. */
      .vertical-menu .h-100 {
        padding-bottom: 96px !important;
      }
      /* And put a matching spacer on the menu list itself so the last item
         always clears the logout button even when the inner div is short. */
      .vertical-menu #sidebar-menu > ul {
        margin-bottom: 24px;
      }
    }
  `}</style>
);

/**
 * Close the mobile sidebar by removing the `sidebar-enable` class.
 */
export const closeMobileSidebar = () => {
  if (typeof document !== "undefined") {
    document.body.classList.remove("sidebar-enable");
  }
};

/**
 * Mobile chrome to drop inside a sidebar:
 *   - close (X) button in the top-right (mobile only)
 *   - bottom logout button (mobile only) so users can sign out even when the
 *     sidebar covers the topbar
 *   - auto-closes the sidebar when the route changes on mobile
 *
 * Also renders the backdrop that dismisses the sidebar when tapped.
 *
 * Usage: place inside the `.vertical-menu` element. Pass an `onLogout`
 * callback that clears auth state and navigates to /login.
 */
export const MobileSidebarChrome: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();

  // Auto-close the mobile drawer whenever the user navigates.
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 992) {
      closeMobileSidebar();
    }
  }, [location.pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="kago-sidebar-close"
        onClick={closeMobileSidebar}
      >
        <X size={18} />
      </button>
      <button
        type="button"
        className="kago-sidebar-mobile-logout"
        onClick={() => {
          closeMobileSidebar();
          onLogout();
        }}
      >
        <LogOut size={18} />
        <span>Log out</span>
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="kago-sidebar-backdrop"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />,
          document.body
        )}
    </>
  );
};
