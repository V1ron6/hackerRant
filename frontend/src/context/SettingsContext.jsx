/**
 * Settings Context — the signed-in user's preferences (notifications, chat theme,
 * location sharing). Also shows browser notifications for incoming messages while
 * the tab is hidden, when the user has them enabled and granted permission.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';

const SettingsContext = createContext(null);
const DEFAULTS = { notifications: true, chat_theme: 'default', share_location: false };

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    settingsService
      .get()
      .then((res) => alive && setSettings({ ...DEFAULTS, ...res.data }))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const update = useCallback(async (patch) => {
    const prev = settings;
    setSettings((s) => ({ ...s, ...patch })); // optimistic
    try {
      const res = await settingsService.update(patch);
      setSettings({ ...DEFAULTS, ...res.data });
      return res;
    } catch (err) {
      setSettings(prev);
      throw err;
    }
  }, [settings]);

  // Browser notification for messages that arrive while the tab is in the background.
  useEffect(() => {
    if (!user || !settings.notifications) return undefined;
    const socket = getSocket();
    const onMessage = (msg) => {
      if (!msg || msg.senderId === user.id) return;
      if (!document.hidden || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      try {
        const n = new Notification('New message on hackerRant', { body: String(msg.text || '').slice(0, 120), tag: 'hr-message' });
        n.onclick = () => { window.focus(); n.close(); };
      } catch { /* some browsers only allow notifications through a service worker */ }
    };
    socket.on('message:receive', onMessage);
    return () => socket.off('message:receive', onMessage);
  }, [user, settings.notifications]);

  const value = useMemo(() => ({ settings, loading, update }), [settings, loading, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
