import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionContext = createContext(null);

const SESSION_TIMEOUT = 10 * 60 * 1000;     // 10 minutes
const WARNING_BEFORE = 2 * 60 * 1000;     // show warning 2 min before expiry

export const SessionProvider = ({ children }) => {
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const performLogout = useCallback(() => {
    clearTimers();
    setShowSessionWarning(false);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberMe');
    window.location.href = '/login';
  }, [clearTimers]);

  const startSessionTimers = useCallback(() => {
    clearTimers();

    const user = localStorage.getItem('user');
    if (!user) return;

    // Show warning before timeout
    warningTimerRef.current = setTimeout(() => {
      const remaining = Math.floor(WARNING_BEFORE / 1000);
      setTimeRemaining(remaining);
      setShowSessionWarning(true);

      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            performLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, SESSION_TIMEOUT - WARNING_BEFORE);

    // Auto-logout at timeout
    logoutTimerRef.current = setTimeout(performLogout, SESSION_TIMEOUT);
  }, [clearTimers, performLogout]);

  const continueSession = useCallback(() => {
    setShowSessionWarning(false);
    clearInterval(countdownRef.current);
    startSessionTimers();
  }, [startSessionTimers]);

  // Reset timers on user activity
  useEffect(() => {
    const resetOnActivity = () => {
      if (!showSessionWarning) startSessionTimers();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetOnActivity, { passive: true }));
    startSessionTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetOnActivity));
      clearTimers();
    };
  }, [startSessionTimers, clearTimers, showSessionWarning]);

  return (
    <SessionContext.Provider value={{ showSessionWarning, timeRemaining, continueSession, performLogout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};
