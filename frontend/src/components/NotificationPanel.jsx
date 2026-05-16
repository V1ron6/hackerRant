import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Check, CheckCheck, Trash2, Info, AlertTriangle,
  CheckCircle, XCircle, Clock, Megaphone, ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { useToast } from './ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const TYPE_STYLES = {
  info:         { icon: Info,          bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  warning:      { icon: AlertTriangle, bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
  success:      { icon: CheckCircle,   bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400' },
  error:        { icon: XCircle,       bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  reminder:     { icon: Clock,         bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  announcement: { icon: Megaphone,     bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
};

const NotificationPanel = ({ variant = 'light', onClose, onCountChange }) => {
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const panelRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const isDark = variant === 'dark';

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const fetchNotifications = useCallback(async (pg = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = { page: pg, limit: 15 };
      if (filter === 'unread') params.unreadOnly = 'true';
      const { data } = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token, filter]);

  useEffect(() => { fetchNotifications(page); }, [fetchNotifications, page]);

  const refreshCount = async () => {
    try {
      const { data } = await axios.get(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) onCountChange?.(data.data.unreadCount ?? 0);
    } catch { /* silent */ }
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`${API}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      refreshCount();
    } catch { toast.error('Failed to mark as read.'); }
  };

  const markAllRead = async () => {
    try {
      await axios.patch(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      onCountChange?.(0);
      toast.success('All marked as read.');
    } catch { toast.error('Failed to mark all as read.'); }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      refreshCount();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete this notification.');
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const bg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  const headerBg = isDark ? 'bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-700/50';

  return (
    <div
      ref={panelRef}
      className={`
        fixed left-2 right-2 top-16 z-50
        max-h-[calc(100vh-5rem)] overflow-hidden
        rounded-xl border shadow-2xl
        sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-[24rem] sm:max-w-[calc(100vw-2rem)] sm:max-h-136
        ${bg}
      `}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200 dark:border-gray-700'} ${headerBg}`}>
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} title="Mark all read"
            className={`p-1.5 rounded-md transition ${isDark ? 'text-gray-400 hover:text-green-400 hover:bg-gray-800' : 'text-gray-400 hover:text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <CheckCheck size={16} />
          </button>
          <button onClick={onClose}
            className={`p-1.5 rounded-md transition ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className={`flex gap-1 px-4 py-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-100 dark:border-gray-700'}`}>
        {['all', 'unread'].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
              filter === f
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300')
                : (isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700')
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="max-h-100 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Info size={28} className="mx-auto mb-2 opacity-30 text-gray-400" />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
            </p>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => {
              const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
              const Icon = style.icon;
              return (
                <li
                  key={n.id}
                  className={`relative group px-4 py-3 border-b last:border-b-0 transition ${
                    isDark ? 'border-gray-800 hover:bg-gray-800/60' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  } ${!n.isRead ? (isDark ? 'bg-gray-800/30' : 'bg-blue-50/50 dark:bg-blue-900/10') : ''}`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
                      <Icon size={16} className={style.text} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${isDark ? 'text-gray-200' : 'text-gray-800 dark:text-white'} ${!n.isRead ? '' : 'opacity-70'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {timeAgo(n.createdAt)}
                        </span>
                        {n.cellName && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {n.cellName}
                          </span>
                        )}
                        {n.isBroadcast && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                            Broadcast
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions — show on hover */}
                  <div className="absolute right-3 top-3 hidden group-hover:flex items-center gap-1">
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} title="Mark as read"
                        className={`p-1 rounded transition ${isDark ? 'text-gray-500 hover:text-green-400 hover:bg-gray-700' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'}`}>
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} title="Delete"
                      className={`p-1 rounded transition ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-4 py-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-200 dark:border-gray-700'}`}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className={`text-xs px-2 py-1 rounded transition disabled:opacity-30 ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            ← Prev
          </button>
          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className={`text-xs px-2 py-1 rounded transition disabled:opacity-30 ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
