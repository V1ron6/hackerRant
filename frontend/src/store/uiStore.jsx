/**
 * uiStore
 * Lightweight UI preferences store (no external deps).
 */

import { createContext, useContext, useMemo, useState } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [chatTheme, setChatTheme] = useState('classic');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const value = useMemo(
    () => ({
      chatTheme,
      setChatTheme,
      notificationsEnabled,
      setNotificationsEnabled,
    }),
    [chatTheme, notificationsEnabled]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUIStore = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUIStore must be used within UIProvider');
  return ctx;
};
