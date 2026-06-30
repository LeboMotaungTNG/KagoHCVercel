import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

/**
 * MobileBottomNav — the signature mobile-app navigation pattern.
 *
 *  - Fixed to the bottom of the viewport on screens ≤ 992 px.
 *  - 4 role-specific quick-link slots + a "Menu" button that opens the
 *    existing left drawer (toggles `sidebar-enable` on body).
 *  - Honors iOS safe-area inset.
 *  - Hidden on desktop.
 *
 * Usage in each SharedLayout:
 *   <MobileBottomNav items={[
 *     { to: "/employee", label: "Home", icon: <Home size={20} /> },
 *     …
 *   ]} />
 */

export interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  /**
   * Optional matcher override. If provided, the item is considered active
   * when this returns true for the current pathname. Defaults to:
   *   pathname === to || pathname.startsWith(to + "/")
   */
  match?: (pathname: string) => boolean;
}

const openSidebar = () => {
  if (typeof document !== "undefined") {
    document.body.classList.add("sidebar-enable");
  }
};

const MobileBottomNav: React.FC<{ items: BottomNavItem[] }> = ({ items }) => {
  const location = useLocation();

  const isActive = (item: BottomNavItem) => {
    if (item.match) return item.match(location.pathname);
    if (item.to === "/" || /^\/[^/]+$/.test(item.to)) {
      return location.pathname === item.to || location.pathname === item.to + "/";
    }
    return location.pathname === item.to || location.pathname.startsWith(item.to + "/");
  };

  return (
    <>
      <BottomNavStyle />
      <nav className="kg-bottom-nav" role="navigation" aria-label="Primary">
        {items.slice(0, 4).map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`kg-bottom-nav-item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="kg-bottom-nav-icon">{item.icon}</span>
              <span className="kg-bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="kg-bottom-nav-item kg-bottom-nav-more"
          onClick={openSidebar}
          aria-label="Open menu"
        >
          <span className="kg-bottom-nav-icon">
            <Menu size={20} />
          </span>
          <span className="kg-bottom-nav-label">Menu</span>
        </button>
      </nav>
    </>
  );
};

const BottomNavStyle: React.FC = () => (
  <style>{`
    .kg-bottom-nav { display: none; }

    @media (max-width: 992px) {
      .kg-bottom-nav {
        display: flex;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1040;
        background: rgba(255, 255, 255, 0.92);
        -webkit-backdrop-filter: saturate(180%) blur(14px);
        backdrop-filter: saturate(180%) blur(14px);
        border-top: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 -6px 20px rgba(15, 23, 42, 0.08);
        padding-bottom: env(safe-area-inset-bottom);
      }

      .kg-bottom-nav-item {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 8px 6px 10px;
        background: transparent;
        border: 0;
        color: #667085;
        text-decoration: none;
        font: inherit;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.1;
        cursor: pointer;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        transition: color 0.15s ease, transform 0.15s ease;
      }

      .kg-bottom-nav-item:active {
        transform: scale(0.94);
      }

      .kg-bottom-nav-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 12px;
        transition: background-color 0.18s ease, color 0.18s ease;
      }

      .kg-bottom-nav-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .kg-bottom-nav-item.is-active {
        color: #1f6e8a;
      }
      .kg-bottom-nav-item.is-active .kg-bottom-nav-icon {
        background: linear-gradient(135deg, #33a6cd 0%, #5cc2e2 100%);
        color: #ffffff;
        box-shadow: 0 6px 14px rgba(51, 166, 205, 0.35);
      }

      /* Reserve space at the bottom of the page so content doesn't sit
         behind the floating nav. */
      .main-content {
        padding-bottom: calc(72px + env(safe-area-inset-bottom));
      }

      /* When the side drawer is open we don't need the bottom nav, and it
         would float over the drawer's logout button awkwardly. */
      body.sidebar-enable .kg-bottom-nav {
        display: none;
      }
    }

    /* Touch polish — global on mobile only. */
    @media (max-width: 992px) {
      a, button, [role="button"] {
        -webkit-tap-highlight-color: transparent;
      }
    }
  `}</style>
);

export default MobileBottomNav;
