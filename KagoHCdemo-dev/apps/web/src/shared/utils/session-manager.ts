/**
 * Session Manager - Handles user session lifecycle with 30-minute timeout
 * Features:
 * - Tracks user activity (mouse, keyboard, touch)
 * - Auto-logout after 30 minutes of inactivity
 * - Warning before logout (5-minute warning)
 * - Manual session extension capability
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes warning before timeout
const CHECK_INTERVAL = 1000; // Check every second

interface SessionCallbacks {
  onWarning?: (timeRemaining: number) => void;
  onTimeout?: () => void;
  onActivity?: () => void;
}

class SessionManager {
  private lastActivity: number = Date.now();
  private checkIntervalId: number | null = null;
  private isWarningShown: boolean = false;
  private callbacks: SessionCallbacks = {};
  private isActive: boolean = false;

  constructor() {
    this.handleActivity = this.handleActivity.bind(this);
    this.checkSession = this.checkSession.bind(this);
  }

  /**
   * Initialize session tracking
   */
  public initialize(callbacks: SessionCallbacks = {}): void {
    this.callbacks = callbacks;
    this.lastActivity = Date.now();
    this.isActive = true;
    this.isWarningShown = false;

    // Set up activity listeners
    this.setupEventListeners();

    // Start the session check interval
    this.startChecking();

    console.log('[SessionManager] Session tracking initialized - 30min timeout');
  }

  /**
   * Set up event listeners for user activity
   */
  private setupEventListeners(): void {
    const events = [
      'mousedown', 'mousemove', 'keypress',
      'scroll', 'touchstart', 'click',
      'keydown', 'wheel', 'input'
    ];

    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, true);
    });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    const events = [
      'mousedown', 'mousemove', 'keypress',
      'scroll', 'touchstart', 'click',
      'keydown', 'wheel', 'input'
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true);
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity(): void {
    if (!this.isActive) return;
    
    this.lastActivity = Date.now();
    
    // Reset warning flag when user becomes active again
    if (this.isWarningShown) {
      this.isWarningShown = false;
      console.log('[SessionManager] User activity detected - warning reset');
    }

    if (this.callbacks.onActivity) {
      this.callbacks.onActivity();
    }
  }

  /**
   * Start checking session validity
   */
  private startChecking(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    
    this.checkIntervalId = window.setInterval(this.checkSession, CHECK_INTERVAL);
  }

  /**
   * Check if session has expired
   */
  private checkSession(): void {
    if (!this.isActive) return;

    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;

    // Check if session has expired
    if (timeSinceLastActivity >= SESSION_TIMEOUT) {
      console.log('[SessionManager] Session expired - initiating logout');
      this.destroy();
      if (this.callbacks.onTimeout) {
        this.callbacks.onTimeout();
      }
      return;
    }

    // Check if we should show warning (within last 5 minutes)
    if (timeRemaining <= WARNING_THRESHOLD && !this.isWarningShown) {
      this.isWarningShown = true;
      console.log(`[SessionManager] Warning: ${Math.ceil(timeRemaining / 60000)} minutes remaining`);
      if (this.callbacks.onWarning) {
        this.callbacks.onWarning(timeRemaining);
      }
    }
  }

  /**
   * Extend session manually (user clicked "stay logged in")
   */
  public extend(): void {
    this.lastActivity = Date.now();
    this.isWarningShown = false;
    console.log('[SessionManager] Session extended for another 30 minutes');
  }

  /**
   * Get remaining time in milliseconds
   */
  public getRemainingTime(): number {
    if (!this.isActive) return 0;
    return Math.max(0, SESSION_TIMEOUT - (Date.now() - this.lastActivity));
  }

  /**
   * Get remaining time formatted as MM:SS
   */
  public getRemainingTimeFormatted(): string {
    const remaining = this.getRemainingTime();
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if session is active
   */
  public getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Destroy session manager
   */
  public destroy(): void {
    this.isActive = false;
    
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    this.removeEventListeners();
    console.log('[SessionManager] Session tracking stopped');
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

/**
 * Check if the stored JWT token is still valid (not expired)
 * Returns true if token exists and is not expired
 */
export function isTokenValid(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Decode JWT payload (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('[SessionManager] JWT token has expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[SessionManager] Failed to validate token:', error);
    return false;
  }
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpiryTime(): number {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 0;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * Logout helper that clears session and redirects
 */
export function performLogout(navigate?: (path: string) => void): void {
  // Destroy session manager
  sessionManager.destroy();
  
  // Clear auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Show toast or alert
  if (typeof window !== 'undefined') {
    // You can integrate with a toast library here
    console.log('[SessionManager] User logged out');
  }
  
  // Navigate to login
  if (navigate) {
    navigate('/');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

export default sessionManager;

