import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Settings } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import {
  type NotificationRole,
  formatNotificationTime,
} from "../utils/notifications";

export interface NotificationBellProps {
  role: NotificationRole;
  /** Employee settings deep-link; omitted for manager/owner. */
  settingsPath?: string;
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 8px)",
  width: 360,
  maxWidth: "calc(100vw - 24px)",
  background: "#fff",
  border: "1px solid #e8e4df",
  borderRadius: 12,
  boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
  zIndex: 1100,
  overflow: "hidden",
};

const NotificationBell: React.FC<NotificationBellProps> = ({ role, settingsPath }) => {
  const navigate = useNavigate();
  const { visible, unreadCount, markRead, markAllRead } = useNotifications(role);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handleItemClick = (id: string, href?: string) => {
    markRead(id);
    setOpen(false);
    if (href) navigate(href);
  };

  return (
    <div className="dropdown d-inline-block" ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn header-item noti-icon waves-effect"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        onClick={() => setOpen(prev => !prev)}
        style={{ position: "relative" }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
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
        )}
      </button>

      {open && (
        <div style={panelStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #f0ece6",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#b45309",
                    background: "#fff7ed",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#33a6cd",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {visible.length === 0 ? (
              <div
                style={{
                  padding: "28px 16px",
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                No notifications right now.
                {role === "employee" && settingsPath && (
                  <div style={{ marginTop: 8 }}>
                    <Link
                      to={settingsPath}
                      onClick={() => setOpen(false)}
                      style={{ color: "#33a6cd", fontWeight: 600, textDecoration: "none" }}
                    >
                      Manage notification preferences
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              visible.map(n => (
                <button
                  key={n.id}
                  type="button"
                  className="notification-item"
                  onClick={() => handleItemClick(n.id, n.href)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "1px solid #f5f1eb",
                    background: n.read ? "#fff" : "#f8fcfe",
                    textAlign: "left",
                    cursor: "pointer",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: n.read ? 600 : 700,
                          color: "#111827",
                          marginBottom: 4,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          lineHeight: 1.45,
                          marginBottom: 6,
                        }}
                      >
                        {n.body}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        {formatNotificationTime(n.createdAt)}
                      </div>
                    </div>
                    {!n.read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#33a6cd",
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {settingsPath && (
            <div
              style={{
                borderTop: "1px solid #f0ece6",
                padding: "10px 16px",
                background: "#faf8f5",
              }}
            >
              <Link
                to={settingsPath}
                onClick={() => setOpen(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#33a6cd",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Settings size={14} />
                Notification settings
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
