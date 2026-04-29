/**
 * SessionProvider - React context provider for session management
 * Provides session state and controls to all child components
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager, performLogout, isTokenValid } from './session-manager';

interface SessionContextType {
  isWarningVisible: boolean;
  timeRemaining: number;
  extendSession: () => void;
  logout: () => void;
  isSessionActive: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const handleWarning = useCallback((remaining: number) => {
    setTimeRemaining(remaining);
    setIsWarningVisible(true);
  }, []);

  const handleTimeout = useCallback(() => {
    setIsWarningVisible(false);
    setIsSessionActive(false);
    performLogout(navigate);
    
    // Show alert to user
    alert('Your session has expired due to inactivity. Please log in again.');
  }, [navigate]);

  const handleActivity = useCallback(() => {
    if (isWarningVisible) {
      setIsWarningVisible(false);
    }
  }, [isWarningVisible]);

  const extendSession = useCallback(() => {
    sessionManager.extend();
    setIsWarningVisible(false);
    setTimeRemaining(sessionManager.getRemainingTime());
  }, []);

  const logout = useCallback(() => {
    performLogout(navigate);
  }, [navigate]);

  // Initialize session manager when auth token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // If token exists but is expired, log out immediately
    if (token && !isTokenValid()) {
      console.log('[SessionProvider] Token expired on page load - logging out');
      performLogout(navigate);
      alert('Your session has expired. Please log in again.');
      return;
    }
    
    if (token && !sessionManager.getIsActive()) {
      sessionManager.initialize({
        onWarning: handleWarning,
        onTimeout: handleTimeout,
        onActivity: handleActivity,
      });
      setIsSessionActive(true);
    }

    return () => {
      // Don't destroy on unmount - we want session to persist across navigation
    };
  }, [handleWarning, handleTimeout, handleActivity, navigate]);

  // Listen for storage events (login from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue && !sessionManager.getIsActive()) {
          // User logged in
          sessionManager.initialize({
            onWarning: handleWarning,
            onTimeout: handleTimeout,
            onActivity: handleActivity,
          });
          setIsSessionActive(true);
        } else if (!e.newValue) {
          // User logged out
          sessionManager.destroy();
          setIsSessionActive(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleWarning, handleTimeout, handleActivity]);

  const value: SessionContextType = {
    isWarningVisible,
    timeRemaining,
    extendSession,
    logout,
    isSessionActive,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      <SessionWarningModal />
    </SessionContext.Provider>
  );
};

/**
 * Session Warning Modal - Shows when session is about to expire
 */
const SessionWarningModal: React.FC = () => {
  const context = useContext(SessionContext);
  
  if (!context) return null;
  
  const { isWarningVisible, timeRemaining, extendSession, logout } = context;
  
  if (!isWarningVisible) return null;

  const minutes = Math.ceil(timeRemaining / 60000);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#FEF3C7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
            Session Expiring Soon
          </h3>
          
          <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: '14px' }}>
            Your session will expire in approximately {minutes} minute{minutes !== 1 ? 's' : ''} due to inactivity. 
            Would you like to stay logged in?
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Log Out
            </button>
            <button
              onClick={extendSession}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#33a6cd',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to use session context
 */
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionProvider;

