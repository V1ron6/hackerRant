import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Send, Trash2, Users, User, Search,
  Plus, X, Info, AlertTriangle, CheckCircle, XCircle,
  Clock, Megaphone, ChevronDown, RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import Card from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useToast } from '../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const TYPES = ['info', 'warning', 'success', 'reminder', 'announcement'];

const TYPE_CONFIG = {
  info:           { icon: Info,          bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400' },
  warning:       { icon: AlertTriangle, bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
  success:       { icon: CheckCircle,   bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400' },
  error:         { icon: XCircle,       bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  reminder:     { icon: Clock,         bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  announcement: { icon: Megaphone,     bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
};

const CellNotifications = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [cellName, setCellName] = useState('');
  const [members, setMembers] = useState([]);
  const [sent, setSent] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Compose
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [audience, setAudience] = useState('cell'); // 'cell' | 'member'
  const [recipientId, setRecipientId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (!token || !['cellLeader', 'superAdmin'].includes(user.role)) {
      toast.error('Access denied.');
      navigate('/login');
    }
  }, []);

  // Load members
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await axios.get(`${API}/notifications/leader/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setCellName(data.data.cellName || '');
          setMembers(data.data.members || []);
        }
      } catch { /* silent */ }
    };
    if (token) init();
  }, []);

  // Fetch sent notifications
  const fetchSent = async (pg = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/notifications/leader/sent`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pg, limit: 15 },
      });
      if (data.success) {
        setSent(data.data.notifications || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch { toast.error('Failed to load notifications.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchSent(page); }, [page]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 20);
    const q = memberSearch.toLowerCase();
    return members.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [members, memberSearch]);

  // Send notification
  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    setSending(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (audience === 'cell') {
        const body = { title, message, type };
        if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
        const { data } = await axios.post(`${API}/notifications/leader/cell`, body, { headers });
        toast.success(data.message || `Notification sent to ${cellName}.`);
      } else {
        if (!recipientId) { toast.error('Select a member.'); setSending(false); return; }
        const body = { recipientId, title, message, type };
        const { data } = await axios.post(`${API}/notifications/leader/member`, body, { headers });
        toast.success(data.message || 'Notification sent.');
      }
      // Reset form
      setShowCompose(false);
      setTitle('');
      setMessage('');
      setType('info');
      setExpiresAt('');
      setRecipientId('');
      fetchSent(1);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send.');
    } finally { setSending(false); }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await axios.delete(`${API}/notifications/leader/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Notification deleted.');
      fetchSent(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete.');
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/cell/dashboard')}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={20} className="text-purple-500" /> {cellName || 'Cell'} Notifications
          </h1>
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition">
            <Plus size={16} /> New
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cell Members</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{members.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Notifications Sent</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{sent.length}</p>
          </div>
        </div>

        {/* Sent history */}
        <Card title="Sent Notifications" icon={Send}
          action={
            <button onClick={() => fetchSent(page)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition">
              <RefreshCw size={14} />
            </button>
          }>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner message="Loading…" /></div>
          ) : sent.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No notifications sent yet.</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
              {sent.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <div key={n.id} className="flex items-start gap-3 py-3 group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon size={16} className={cfg.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                        </div>
                        <button onClick={() => handleDelete(n.id)} title="Delete"
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                        {n.cellName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            {n.cellName}
                          </span>
                        )}
                        {n.recipient && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            To: {n.recipient.firstName} {n.recipient.lastName}
                          </span>
                        )}
                        {!n.recipient && !n.cellName && (
                          <span className="text-[10px] text-gray-400 italic">Direct</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="text-xs px-2 py-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 transition">
                ← Prev
              </button>
              <span className="text-[10px] text-gray-400">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="text-xs px-2 py-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 transition">
                Next →
              </button>
            </div>
          )}
        </Card>
      </main>

      {/* ── Compose Modal ──────────────── */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Send size={18} className="text-purple-500" /> Send Notification
              </h2>
              <button onClick={() => setShowCompose(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-4">
              {/* Audience toggle */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Send to</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setAudience('cell')}
                    className={`p-3 rounded-xl border text-left transition ${
                      audience === 'cell'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    <Users size={18} className={audience === 'cell' ? 'text-purple-500 mb-1' : 'text-gray-400 mb-1'} />
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Entire Cell</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{members.length} members</p>
                  </button>
                  <button type="button" onClick={() => setAudience('member')}
                    className={`p-3 rounded-xl border text-left transition ${
                      audience === 'member'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    <User size={18} className={audience === 'member' ? 'text-purple-500 mb-1' : 'text-gray-400 mb-1'} />
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Individual</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Specific member</p>
                  </button>
                </div>
              </div>

              {/* Member selector */}
              {audience === 'member' && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Select Member</label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search members…"
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Choose member…</option>
                    {filteredMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {m.email}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type pills */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <button key={t} type="button" onClick={() => setType(t)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition capitalize ${
                          type === t
                            ? `${cfg.bg} ${cfg.text} border-current`
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}>
                        <Icon size={12} /> {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  maxLength={255} placeholder="Notification title…"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  rows={4} placeholder="Write your message…"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>

              {/* Expires (only for cell-wide) */}
              {audience === 'cell' && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Expires at <span className="text-gray-400">(optional)</span>
                  </label>
                  <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={sending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                  <Send size={14} /> {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CellNotifications;
