import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Users, Building2, User, Mail,
  MessageSquare, ChevronDown, X, CheckCircle, Clock,
  AlertTriangle, Search, RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import LoadingScreen from '../../../../components/LoadingScreen';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const AUDIENCES = [
  { value: 'all', label: 'All Members', icon: Users, desc: 'Send to every registered member' },
  { value: 'cell', label: 'Specific Cell', icon: Building2, desc: 'Target members in a cell group' },
  { value: 'individual', label: 'Individual', icon: User, desc: 'Send to a specific member' },
];

const SendMessage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [cells, setCells] = useState([]);
  const [members, setMembers] = useState([]);

  // Form
  const [audience, setAudience] = useState('all');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // History
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!token || user.role !== 'superAdmin') {
      toast.error('Super Admin access required.');
      navigate('/admin/login');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [cRes, mRes] = await Promise.allSettled([
          axios.get(`${API}/admin/cells`, { headers }),
          axios.get(`${API}/admin/members`, { headers }),
        ]);
        if (cRes.status === 'fulfilled') setCells(cRes.value.data.data || []);
        if (mRes.status === 'fulfilled') setMembers(mRes.value.data.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    if (token) load();
  }, []);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 20);
    const q = memberSearch.toLowerCase();
    return members.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [members, memberSearch]);

  const recipientCount = useMemo(() => {
    if (audience === 'all') return members.length;
    if (audience === 'cell') return members.filter((m) => m.cellName === selectedCell).length;
    return selectedMember ? 1 : 0;
  }, [audience, selectedCell, selectedMember, members]);

  const canSend = body.trim() && subject.trim() &&
    (audience === 'all' || (audience === 'cell' && selectedCell) || (audience === 'individual' && selectedMember));

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const payload = { subject, body, audience };
      if (audience === 'cell') payload.cellName = selectedCell;
      if (audience === 'individual') payload.memberId = selectedMember;

      const res = await axios.post(`${API}/admin/messages/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data || {};
      const sent = data.sent ?? recipientCount;
      const failed = data.failed ?? 0;
      toast.success(`Message sent to ${sent} recipient(s)${failed > 0 ? ` (${failed} failed)` : ''}.`);
      setHistory((prev) => [
        { id: data.messageId || Date.now(), subject, audience, recipientCount: sent, failed, sentAt: new Date().toISOString() },
        ...prev,
      ]);
      setSubject('');
      setBody('');
      setAudience('all');
      setSelectedCell('');
      setSelectedMember('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send message.';
      toast.error(msg);
    } finally { setSending(false); }
  };

  if (loading) return <LoadingScreen message="Loading dashboard" submessage="Fetching message data..." />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-400" /> Send Message
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Compose form ──────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Audience selector */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Audience</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AUDIENCES.map((a) => {
                const Icon = a.icon;
                const active = audience === a.value;
                return (
                  <button key={a.value} onClick={() => { setAudience(a.value); setSelectedCell(''); setSelectedMember(''); }}
                    className={`p-3 rounded-xl border text-left transition ${
                      active
                        ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}>
                    <Icon size={18} className={active ? 'text-blue-400' : 'text-gray-500'} />
                    <p className={`mt-1 text-sm font-medium ${active ? 'text-blue-300' : 'text-gray-300'}`}>{a.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cell picker */}
          {audience === 'cell' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Select Cell</label>
              <div className="relative">
                <select value={selectedCell} onChange={(e) => setSelectedCell(e.target.value)}
                  className="w-full appearance-none bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose a cell group…</option>
                  {cells.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({members.filter((m) => m.cellName === c.name).length} members)
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Individual picker */}
          {audience === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Select Member</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="max-h-40 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
                {filteredMembers.map((m) => (
                  <button key={m.id} onClick={() => setSelectedMember(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                      selectedMember === m.id ? 'bg-blue-600/10' : 'hover:bg-gray-800/50'
                    }`}>
                    <div className="w-7 h-7 rounded-full bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    </div>
                    {selectedMember === m.id && <CheckCircle size={14} className="text-blue-400 ml-auto shrink-0" />}
                  </button>
                ))}
                {filteredMembers.length === 0 && <p className="text-center py-3 text-xs text-gray-500">No results</p>}
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Service Reminder"
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6}
              placeholder="Type your message here…"
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-600 mt-1">{body.length} characters</p>
          </div>

          {/* Send */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              <Mail size={12} className="inline mr-1" />
              Recipients: <span className="text-gray-300 font-medium">{recipientCount}</span>
            </p>
            <button onClick={handleSend} disabled={!canSend || sending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </div>

        {/* ── Sidebar — recent sent ──────── */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mb-3">
              <Clock size={14} /> Recent Sent
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-6">No messages sent this session.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((h) => (
                  <li key={h.id} className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-200 truncate">{h.subject}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 capitalize">{h.audience} · {h.recipientCount} sent{h.failed > 0 ? ` · ${h.failed} failed` : ''}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(h.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stats quick glance */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Quick Stats</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Total Members</span>
              <span className="text-sm font-bold text-gray-200">{members.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Cell Groups</span>
              <span className="text-sm font-bold text-gray-200">{cells.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Active Members</span>
              <span className="text-sm font-bold text-green-400">{members.filter((m) => m.status === 'active').length}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SendMessage;
