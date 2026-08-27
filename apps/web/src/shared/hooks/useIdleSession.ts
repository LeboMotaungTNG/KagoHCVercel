import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LAST_ACTIVITY_KEY,
  clearSession,
  getLastActivity,
  isJwtExpired,
  isLoggedIn,
  touchActivity,
} from "../utils/auth";

/** Idle time before the "Are you still there?" prompt appears. */
export const IDLE_WARNING_MS = 15 * 60 * 1000;

/** Time to respond before automatic sign-out. */
export const LOGOUT_COUNTDOWN_MS = 2 * 60 * 1000;

const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_THROTTLE_MS = 30 * 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

const isPublicPath = (pathname: string): boolean =>
  pathname === "/" ||
  pathname === "/login" ||
  pathname.startsWith("/forgot-password") ||
  pathname.startsWith("/reset-password") ||
  pathname.startsWith("/accept-invite");

export const useIdleSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(LOGOUT_COUNTDOWN_MS / 1000),
  );
  const lastTouchRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const signOut = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setShowWarning(false);
    clearSession();
    navigate("/", { replace: true, state: { sessionExpired: true } });
  }, [navigate]);

  const stayLoggedIn = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    touchActivity();
    setShowWarning(false);
    setSecondsLeft(Math.ceil(LOGOUT_COUNTDOWN_MS / 1000));
  }, []);

  const evaluateIdle = useCallback(() => {
    if (!isLoggedIn() || isPublicPath(location.pathname)) {
      setShowWarning(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (token && isJwtExpired(token)) {
      signOut();
      return;
    }

    const idleFor = Date.now() - getLastActivity();
    if (idleFor >= IDLE_WARNING_MS) {
      setShowWarning(true);
    }
  }, [location.pathname, signOut]);

  const recordActivity = useCallback(() => {
    if (!isLoggedIn() || isPublicPath(location.pathname)) return;

    const now = Date.now();
    if (now - lastTouchRef.current < ACTIVITY_THROTTLE_MS) return;
    lastTouchRef.current = now;
    touchActivity();

    if (showWarning) {
      stayLoggedIn();
    }
  }, [location.pathname, showWarning, stayLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn() || isPublicPath(location.pathname)) return;

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      touchActivity();
    }

    const onActivity = () => recordActivity();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        setShowWarning(false);
        setSecondsLeft(Math.ceil(LOGOUT_COUNTDOWN_MS / 1000));
      }
      if (e.key === "token" && !e.newValue) {
        setShowWarning(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        evaluateIdle();
      }
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    const checkId = window.setInterval(evaluateIdle, CHECK_INTERVAL_MS);
    evaluateIdle();

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(checkId);
    };
  }, [location.pathname, evaluateIdle, recordActivity]);

  useEffect(() => {
    if (!showWarning) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    setSecondsLeft(Math.ceil(LOGOUT_COUNTDOWN_MS / 1000));

    countdownRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          signOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [showWarning, signOut]);

  return { showWarning, secondsLeft, stayLoggedIn, signOut };
};
