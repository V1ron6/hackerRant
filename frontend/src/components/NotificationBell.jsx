import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';

const API = import.meta.env.VITE_API_BASE_URL;
const POLL_INTERVAL = 60_000; // 60s

const NotificationBell = ({ variant = 'light' }) => {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem('authToken');

  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setUnread(data.data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchCount]);

  const isDark = variant === 'dark';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`relative p-2 rounded-lg transition ${
          isDark
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-gray-900">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          variant={variant}
          onClose={() => setOpen(false)}
          onCountChange={setUnread}
        />
      )}
    </div>
  );
};

export default NotificationBell;
