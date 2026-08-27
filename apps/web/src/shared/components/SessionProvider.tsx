import React from "react";
import { useIdleSession } from "../hooks/useIdleSession";
import SessionTimeoutModal from "./SessionTimeoutModal";

const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showWarning, secondsLeft, stayLoggedIn, signOut } = useIdleSession();

  return (
    <>
      {children}
      {showWarning && (
        <SessionTimeoutModal
          secondsLeft={secondsLeft}
          onStay={stayLoggedIn}
          onSignOut={signOut}
        />
      )}
    </>
  );
};

export default SessionProvider;
