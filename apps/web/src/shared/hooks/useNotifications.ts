import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AppNotification,
  type NotificationRole,
  NOTIFICATIONS_UPDATED_EVENT,
  ensureNotificationSeeds,
  fetchServerNotifications,
  filterNotificationsByPreferences,
  getUnreadCount,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  mergeWithServerNotifications,
} from "../utils/notifications";

// Drop into: apps/web/src/shared/hooks/useNotifications.ts (or wherever the
// existing hook lives)
//
// Polls the backend every 30s for real notifications (leave approved/
// rejected/submitted, etc.) and merges them with whatever's still in
// localStorage (demo seeds + the review-workflow notifications, which
// haven't been migrated to the backend yet). Same public return shape as
// before — nothing downstream that consumes this hook needs to change.

const POLL_INTERVAL_MS = 30_000;

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
  // Guards against a slow-resolving fetch from an earlier role/email
  // clobbering a newer one (e.g. rapid role switch during testing).
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentEmail = userEmail();
    setEmail(currentEmail);

    const thisRequest = ++requestId.current;
    const local = ensureNotificationSeeds(role, currentEmail);

    // Local seeds render immediately so the UI doesn't sit empty while the
    // network call is in flight.
    setItems(local);

    const server = await fetchServerNotifications();
    if (thisRequest !== requestId.current) return; // a newer refresh already landed

    setItems(mergeWithServerNotifications(local, server));
  }, [role]);

  useEffect(() => {
    refresh();

    const onUpdate = () => refresh();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);

    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
      window.clearInterval(interval);
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
    async (id: string) => {
      await markNotificationRead(id, role, email);
      await refresh();
    },
    [role, email, refresh],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead(role, email);
    await refresh();
  }, [role, email, refresh]);

  return { visible, unreadCount, markRead, markAllRead, refresh };
};