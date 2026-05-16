import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Plus, Trash2, Edit3, Send, Search,
  Filter, ChevronDown, X, Megaphone, Building2, User,
  Info, AlertTriangle, CheckCircle, XCircle, Clock,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const TYPES = ['info', 'warning', 'success', 'error', 'reminder', 'announcement'];

const TYPE_CONFIG = {
  info:         { icon: Info,          color: 'blue' },
  warning:      { icon: AlertTriangle, color: 'yellow' },
  success:      { icon: CheckCircle,   color: 'green' },
  error:        { icon: XCircle,       color: 'red' },
  reminder:     { icon: Clock,         color: 'purple' },
  announcement: { icon: Megaphone,     color: 'orange' },
};

const ManageNotifications = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cells, setCells] = useState([]);
  const [members, setMembers] = useState([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [broadcastFilter, setBroadcastFilter] = useState('');
  const [cellFilter, setCellFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sending, setSending] = useState(false);

  // Form
  const [form, setForm] = useState({
    title: '', message: '', type: 'info',
    audience: 'broadcast', // broadcast | cell | individual
    cellName: '', recipientId: '', expiresAt: '',
  });

  useEffect(() => {
    if (!token || user.role !== 'superAdmin') {
      toast.error('Super Admin access required.');
      navigate('/admin/login');
    }
  }, []);

  // Load cells + members once
  useEffect(() => {
    const init = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const [cRes, mRes] = await Promise.allSettled([
        axios.get(`${API}/admin/cells`, { headers }),
        axios.get(`${API}/admin/members`, { headers }),
      ]);
      if (cRes.status === 'fulfilled') setCells(cRes.value.data.data || []);
      if (mRes.status === 'fulfilled') setMembers(mRes.value.data.data || []);
    };
    if (token) init();
  }, []);

  // Fetch notifications
  const fetchNotifications = async (pg = 1) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const params = { page: pg, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      if (broadcastFilter) params.isBroadcast = broadcastFilter;
      if (cellFilter) params.cellName = cellFilter;
      const { data } = await axios.get(`${API}/notifications/admin/all`, { headers, params });
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch { toast.error('Failed to load notifications.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchNotifications(page); }, [page, typeFilter, broadcastFilter, cellFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notifications;
    const q = search.toLowerCase();
    return notifications.filter((n) =>
      n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q)
    );
  }, [notifications, search]);

  // Open create modal
  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', message: '', type: 'info', audience: 'broadcast', cellName: '', recipientId: '', expiresAt: '' });
    setShowModal(true);
  };

  // Open edit modal
  const openEdit = (n) => {
    setEditing(n);
    setForm({
      title: n.title, message: n.message, type: n.type || 'info',
      audience: n.isBroadcast ? 'broadcast' : n.cellName ? 'cell' : 'individual',
      cellName: n.cellName || '', recipientId: n.recipientId || '',
      expiresAt: n.expiresAt ? n.expiresAt.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  // Submit create / edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    setSending(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editing) {
        // Update
        const body = { title: form.title, message: form.message, type: form.type };
        if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
        await axios.put(`${API}/notifications/admin/${editing.id}`, body, { headers });
        toast.success('Notification updated.');
      } else {
        // Create — decide endpoint based on audience
        if (form.audience === 'broadcast') {
          const body = { title: form.title, message: form.message, type: form.type };
          if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
          await axios.post(`${API}/notifications/admin/broadcast`, body, { headers });
          toast.success('Broadcast sent to all users.');
        } else if (form.audience === 'cell') {
          if (!form.cellName) { toast.error('Select a cell group.'); setSending(false); return; }
          const body = { cellName: form.cellName, title: form.title, message: form.message, type: form.type };
          if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
          await axios.post(`${API}/notifications/admin/cell`, body, { headers });
          toast.success(`Notification sent to ${form.cellName}.`);
        } else {
          if (!form.recipientId) { toast.error('Select a recipient.'); setSending(false); return; }
          const body = {
            recipientId: form.recipientId, title: form.title, message: form.message,
            type: form.type, isBroadcast: false,
          };
          if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
          await axios.post(`${API}/notifications/admin/create`, body, { headers });
          toast.success('Notification sent.');
        }
      }
      setShowModal(false);
      fetchNotifications(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notification.');
    } finally { setSending(false); }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await axios.delete(`${API}/notifications/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Notification deleted.');
      fetchNotifications(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Bell size={20} className="text-yellow-400" /> Notifications
          </h1>
          <button onClick={openCreate}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> New
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={broadcastFilter} onChange={(e) => { setBroadcastFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All scopes</option>
              <option value="true">Broadcast</option>
              <option value="false">Targeted</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={cellFilter} onChange={(e) => { setCellFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All cells</option>
              {cells.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <button onClick={() => fetchNotifications(page)}
            className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner message="Loading notifications…" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Scope</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Message</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <tr key={n.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-${cfg.color}-900/30 text-${cfg.color}-400`}>
                          <Icon size={12} /> {n.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-200 max-w-[200px] truncate">{n.title}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {n.isBroadcast ? (
                          <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <Megaphone size={10} /> Broadcast
                          </span>
                        ) : n.cellName ? (
                          <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <Building2 size={10} /> {n.cellName}
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <User size={10} /> Individual
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-400 max-w-[250px] truncate">{n.message}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{timeAgo(n.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(n)} title="Edit"
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded transition">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDelete(n.id)} title="Delete"
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition disabled:opacity-30">
                  ← Previous
                </button>
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition disabled:opacity-30">
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Create / Edit Modal ──────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {editing ? <><Edit3 size={18} className="text-blue-400" /> Edit Notification</> : <><Plus size={18} className="text-blue-400" /> Create Notification</>}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Audience (only for create) */}
              {!editing && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Send to</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'broadcast', label: 'Broadcast', icon: Megaphone, desc: 'All users' },
                      { value: 'cell', label: 'Cell Group', icon: Building2, desc: 'Specific cell' },
                      { value: 'individual', label: 'Individual', icon: User, desc: 'One person' },
                    ].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setForm((f) => ({ ...f, audience: opt.value }))}
                        className={`p-3 rounded-xl border text-left transition ${
                          form.audience === opt.value
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-gray-800 hover:border-gray-700'
                        }`}>
                        <opt.icon size={18} className={form.audience === opt.value ? 'text-blue-400 mb-1' : 'text-gray-500 mb-1'} />
                        <p className="text-xs font-medium text-gray-200">{opt.label}</p>
                        <p className="text-[10px] text-gray-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cell selector */}
              {!editing && form.audience === 'cell' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cell Group</label>
                  <select value={form.cellName} onChange={(e) => setForm((f) => ({ ...f, cellName: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select cell…</option>
                    {cells.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Recipient selector */}
              {!editing && form.audience === 'individual' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Recipient</label>
                  <select value={form.recipientId} onChange={(e) => setForm((f) => ({ ...f, recipientId: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select member…</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {m.email}</option>)}
                  </select>
                </div>
              )}

              {/* Type */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition capitalize ${
                          form.type === t
                            ? `border-${cfg.color}-500 bg-${cfg.color}-900/20 text-${cfg.color}-400`
                            : 'border-gray-800 text-gray-500 hover:border-gray-700'
                        }`}>
                        <Icon size={12} /> {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={255} placeholder="Notification title…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Message</label>
                <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4} placeholder="Notification message…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Expires at */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Expires at <span className="text-gray-600">(optional)</span></label>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={sending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium rounded-lg transition">
                  <Send size={14} /> {sending ? 'Sending…' : editing ? 'Update' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNotifications;
