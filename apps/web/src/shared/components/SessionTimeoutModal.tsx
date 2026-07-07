import React, { useEffect } from "react";
import { Clock } from "lucide-react";
import { C, R } from "../utils/employee";

interface SessionTimeoutModalProps {
  secondsLeft: number;
  onStay: () => void;
  onSignOut: () => void;
}

const formatCountdown = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  secondsLeft,
  onStay,
  onSignOut,
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      id="session-timeout-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.55)",
          backdropFilter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: C.surface,
          borderRadius: R.xl,
          border: `1px solid ${C.line}`,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          padding: "28px 28px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            margin: "0 auto 16px",
            background: C.warnBg,
            color: C.warn,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Clock size={26} />
        </div>

        <h2
          id="session-timeout-title"
          style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: C.ink }}
        >
          Are you still there?
        </h2>
        <p
          id="session-timeout-desc"
          style={{ margin: "0 0 16px", fontSize: 14, color: C.muted, lineHeight: 1.5 }}
        >
          Your session will end soon due to inactivity. Choose to stay signed in or sign out now.
        </p>

        <p
          className="countdown-holder"
          style={{
            margin: "0 0 24px",
            fontSize: 15,
            fontWeight: 700,
            color: C.bad,
          }}
        >
          Signing out in {formatCountdown(secondsLeft)}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={onStay}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: C.primary,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(51,166,205,0.28)",
            }}
          >
            Yes, I&apos;m here
          </button>
          <button
            type="button"
            onClick={onSignOut}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: 10,
              border: `1px solid ${C.line}`,
              background: C.surface,
              color: C.ink,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign out now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
