import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Search, X, Mail, Phone, Calendar,
  Building2, RefreshCw, AlertTriangle, CheckCircle, Clock,
  UserCheck, UserMinus, UserX, Eye, Filter, ChevronDown,
  Shield, Edit2, Trash2,
} from 'lucide-react';
import axios from 'axios';
import Card from '../../../../components/Card';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import LoadingScreen from '../../../../components/LoadingScreen';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const STATUS_BADGE = {
  active: 'bg-green-900/40 text-green-400',
  inactive: 'bg-gray-800 text-gray-400',
  suspended: 'bg-red-900/40 text-red-400',
};

const MembersManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [cells, setCells] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cellFilter, setCellFilter] = useState('all');

  // Detail slide-over
  const [selected, setSelected] = useState(null);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [loadingAtt, setLoadingAtt] = useState(false);

  // Actions
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  // Cell reassign
  const [showReassign, setShowReassign] = useState(null);
  const [newCell, setNewCell] = useState('');

  useEffect(() => {
    if (!token || user.role !== 'superAdmin') {
      toast.error('Super Admin access required.');
      navigate('/admin/login');
    }
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [membersRes, cellsRes] = await Promise.allSettled([
        axios.get(`${API}/admin/members`, { headers }),
        axios.get(`${API}/admin/cells`, { headers }),
      ]);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value.data.data || []);
      if (cellsRes.status === 'fulfilled') setCells(cellsRes.value.data.data || []);
    } catch { toast.error('Failed to load members.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchMembers(); }, []);

  const filtered = useMemo(() => {
    let list = members;
    if (statusFilter !== 'all') list = list.filter((m) => m.status === statusFilter);
    if (cellFilter !== 'all') list = list.filter((m) => m.cellName === cellFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phoneNumber?.includes(q)
      );
    }
    return list;
  }, [members, search, statusFilter, cellFilter]);

  const counts = useMemo(() => {
    const c = { all: members.length, active: 0, inactive: 0, suspended: 0 };
    members.forEach((m) => { if (c[m.status] !== undefined) c[m.status]++; });
    return c;
  }, [members]);

  const cellNames = useMemo(() => [...new Set(members.map((m) => m.cellName).filter(Boolean))].sort(), [members]);

  // View member
  const viewMember = async (member) => {
    setSelected(member);
    setLoadingAtt(true);
    try {
      const { data } = await axios.get(`${API}/attendance/member/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setMemberAttendance(data.data.attendance || []);
    } catch { setMemberAttendance([]); }
    finally { setLoadingAtt(false); }
  };

  // Update status
  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const { data } = await axios.put(`${API}/admin/members/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(`Member ${status}.`);
        setMembers((p) => p.map((m) => (m.id === id ? { ...m, status } : m)));
        if (selected?.id === id) setSelected((p) => ({ ...p, status }));
        setConfirmAction(null);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setUpdating(false); }
  };

  // Reassign cell
  const reassignCell = async (id) => {
    if (!newCell) return;
    setUpdating(true);
    try {
      const { data } = await axios.put(`${API}/admin/members/${id}`, { cellName: newCell }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success('Cell reassigned.');
        setMembers((p) => p.map((m) => (m.id === id ? { ...m, cellName: newCell } : m)));
        if (selected?.id === id) setSelected((p) => ({ ...p, cellName: newCell }));
        setShowReassign(null);
        setNewCell('');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Reassign failed.'); }
    finally { setUpdating(false); }
  };

  // Remove
  const removeMember = async (id) => {
    setUpdating(true);
    try {
      const { data } = await axios.delete(`${API}/admin/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success('Member removed.');
        setMembers((p) => p.filter((m) => m.id !== id));
        setSelected(null);
        setConfirmAction(null);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Remove failed.'); }
    finally { setUpdating(false); }
  };

  if (loading) return <LoadingScreen message="Loading members" submessage="Fetching member information..." />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Users size={20} className="text-green-400" /> Members ({counts.all})
          </h1>
          <button onClick={fetchMembers} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex gap-1">
            {['all', 'active', 'inactive', 'suspended'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                  statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                }`}>
                {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
              </button>
            ))}
          </div>

          {/* Cell filter */}
          <div className="relative">
            <select value={cellFilter} onChange={(e) => setCellFilter(e.target.value)}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 pr-8 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="all">All cells</option>
              {cellNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Members table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No members found</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Member</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Cell</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <ul className="divide-y divide-gray-800">
              {filtered.map((m) => (
                <li key={m.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-4 py-3 hover:bg-gray-800/30 transition items-center">
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-900/40 flex items-center justify-center text-sm font-bold text-green-400 shrink-0">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{m.firstName} {m.lastName}</p>
                      {m.isVerified && <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><CheckCircle size={10} /> Verified</span>}
                    </div>
                  </div>
                  <div className="hidden lg:block lg:col-span-2 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.phoneNumber}</p>
                  </div>
                  <div className="hidden lg:block lg:col-span-2">
                    <span className="text-xs text-gray-300 flex items-center gap-1"><Building2 size={11} /> {m.cellName}</span>
                  </div>
                  <div className="lg:col-span-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[m.status] || STATUS_BADGE.inactive}`}>
                      {m.status === 'active' && <CheckCircle size={10} />}
                      {m.status === 'suspended' && <AlertTriangle size={10} />}
                      {m.status === 'inactive' && <Clock size={10} />}
                      {m.status}
                    </span>
                  </div>
                  <div className="hidden lg:block lg:col-span-2">
                    <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="lg:col-span-2 flex items-center justify-end gap-1">
                    <button onClick={() => viewMember(m)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition" title="View">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => setShowReassign(m)} className="p-1.5 text-gray-500 hover:text-purple-400 hover:bg-purple-900/20 rounded-lg transition" title="Reassign cell">
                      <Building2 size={15} />
                    </button>
                    {m.status !== 'active' ? (
                      <button onClick={() => updateStatus(m.id, 'active')} className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition" title="Activate">
                        <UserCheck size={15} />
                      </button>
                    ) : (
                      <button onClick={() => setConfirmAction({ type: 'suspend', member: m })} className="p-1.5 text-gray-500 hover:text-orange-400 hover:bg-orange-900/20 rounded-lg transition" title="Suspend">
                        <UserMinus size={15} />
                      </button>
                    )}
                    <button onClick={() => setConfirmAction({ type: 'remove', member: m })} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition" title="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 bg-gray-800/30 text-xs text-gray-500">
              Showing {filtered.length} of {members.length} members
            </div>
          </div>
        )}
      </main>

      {/* ── Member detail slide-over ──────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-gray-900 h-full overflow-y-auto shadow-2xl border-l border-gray-800">
            <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold">Member Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-900/40 flex items-center justify-center text-2xl font-bold text-green-400 mx-auto">
                  {selected.firstName?.[0]}{selected.lastName?.[0]}
                </div>
                <h3 className="mt-3 text-lg font-bold">{selected.firstName} {selected.lastName}</h3>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${STATUS_BADGE[selected.status]}`}>
                  {selected.status}
                </span>
              </div>

              <div className="space-y-3 bg-gray-800/40 rounded-lg p-4">
                <div className="flex items-center gap-3 text-sm"><Mail size={15} className="text-gray-500" /><span className="text-gray-300">{selected.email}</span></div>
                <div className="flex items-center gap-3 text-sm"><Phone size={15} className="text-gray-500" /><span className="text-gray-300">{selected.phoneNumber}</span></div>
                <div className="flex items-center gap-3 text-sm"><Building2 size={15} className="text-gray-500" /><span className="text-gray-300">{selected.cellName}</span></div>
                <div className="flex items-center gap-3 text-sm"><Calendar size={15} className="text-gray-500" /><span className="text-gray-300">Joined {new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                <div className="flex items-center gap-3 text-sm"><Shield size={15} className="text-gray-500" /><span className="text-gray-300 capitalize">{selected.role} · {selected.isVerified ? 'Verified' : 'Unverified'}</span></div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                {selected.status !== 'active' && (
                  <button onClick={() => updateStatus(selected.id, 'active')} disabled={updating}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
                    <UserCheck size={14} /> Activate
                  </button>
                )}
                {selected.status !== 'suspended' && (
                  <button onClick={() => updateStatus(selected.id, 'suspended')} disabled={updating}
                    className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
                    <UserMinus size={14} /> Suspend
                  </button>
                )}
              </div>

              {/* Attendance */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
                  <Calendar size={14} /> Attendance History ({memberAttendance.length})
                </h4>
                {loadingAtt ? (
                  <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
                ) : memberAttendance.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No records.</p>
                ) : (
                  <ul className="divide-y divide-gray-800 max-h-60 overflow-y-auto">
                    {memberAttendance.slice(0, 20).map((a, i) => (
                      <li key={a.id || i} className="flex items-center gap-3 py-2">
                        <CheckCircle size={14} className="text-green-500 shrink-0" />
                        <p className="text-sm text-gray-300 flex-1">
                          {new Date(a.dateOfAttendance).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <span className="text-xs text-gray-500">{a.checkInTime?.slice(0, 5)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reassign cell modal ───────────────────────── */}
      {showReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowReassign(null)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-1">Reassign Cell</h3>
            <p className="text-sm text-gray-400 mb-4">
              Move <span className="text-white font-medium">{showReassign.firstName} {showReassign.lastName}</span> from {showReassign.cellName} to:
            </p>
            <select value={newCell} onChange={(e) => setNewCell(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4">
              <option value="">Select cell…</option>
              {cells.filter((c) => c.name !== showReassign.cellName).map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.memberCount} members)</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => { setShowReassign(null); setNewCell(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition">
                Cancel
              </button>
              <button onClick={() => reassignCell(showReassign.id)} disabled={updating || !newCell}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition disabled:opacity-60">
                {updating ? 'Moving…' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm dialog ────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full text-center">
            <AlertTriangle size={36} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold">
              {confirmAction.type === 'remove' ? 'Remove Member?' : 'Suspend Member?'}
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              {confirmAction.type === 'remove'
                ? `Permanently remove ${confirmAction.member.firstName} ${confirmAction.member.lastName}?`
                : `Suspend ${confirmAction.member.firstName} ${confirmAction.member.lastName}'s account?`}
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition">
                Cancel
              </button>
              <button
                onClick={() => confirmAction.type === 'remove' ? removeMember(confirmAction.member.id) : updateStatus(confirmAction.member.id, 'suspended')}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-60">
                {updating ? 'Processing…' : confirmAction.type === 'remove' ? 'Remove' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersManagement;
