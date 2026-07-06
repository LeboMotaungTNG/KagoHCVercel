import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AppNotification,
  type NotificationRole,
  NOTIFICATIONS_UPDATED_EVENT,
  ensureNotificationSeeds,
  filterNotificationsByPreferences,
  getUnreadCount,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../utils/notifications";

const userEmail = (): string | undefined => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.email;
  } catch {
    return undefined;
  }
};

export const useNotifications = (role: NotificationRole) => {
  const [email, setEmail] = useState(userEmail);
  const [items, setItems] = useState<AppNotification[]>(() =>
    ensureNotificationSeeds(role, userEmail()),
  );

  const refresh = useCallback(() => {
    const currentEmail = userEmail();
    setEmail(currentEmail);
    setItems(ensureNotificationSeeds(role, currentEmail));
  }, [role]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const visible = useMemo(
    () => filterNotificationsByPreferences(items, role, email),
    [items, role, email],
  );

  const unreadCount = useMemo(
    () => getUnreadCount(items, role, email),
    [items, role, email],
  );

  const markRead = useCallback(
    (id: string) => {
      markNotificationRead(id, role, email);
      setItems(loadNotifications(role, email));
    },
    [role, email],
  );

  const markAllRead = useCallback(() => {
    markAllNotificationsRead(role, email);
    setItems(loadNotifications(role, email));
  }, [role, email]);

  return { visible, unreadCount, markRead, markAllRead, refresh };
};
