import React from "react";

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
  `}</style>
);
