import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Search, Filter, ChevronDown, Mail, Phone,
  Calendar, Shield, UserCheck, UserMinus, UserX, MoreVertical,
  X, RefreshCw, AlertTriangle, CheckCircle, Clock, Eye,
} from 'lucide-react';
import axios from 'axios';
import Card from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import LoadingScreen from '../../../components/LoadingScreen';
import { useToast } from '../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const STATUS_COLORS = {
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  suspended: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

const CellMembers = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);

  useEffect(() => {
    if (!token || !['cellLeader', 'superAdmin'].includes(user.role)) {
      toast.error('Access denied.');
      navigate('/login');
    }
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setMembers(data.data || []);
    } catch {
      toast.error('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchMembers(); }, []);

  // Filtered list
  const filtered = useMemo(() => {
    let list = members;
    if (statusFilter !== 'all') list = list.filter((m) => m.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.phoneNumber?.includes(q)
      );
    }
    return list;
  }, [members, search, statusFilter]);

  // Status counts
  const counts = useMemo(() => {
    const c = { all: members.length, active: 0, inactive: 0, suspended: 0 };
    members.forEach((m) => { if (c[m.status] !== undefined) c[m.status]++; });
    return c;
  }, [members]);

  // View member detail + attendance
  const viewMember = async (member) => {
    setSelectedMember(member);
    setLoadingAttendance(true);
    try {
      const { data } = await axios.get(`${API}/attendance/member/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setMemberAttendance(data.data.attendance || []);
    } catch {
      setMemberAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Update member status
  const updateStatus = async (memberId, status) => {
    setUpdating(true);
    try {
      const { data } = await axios.put(`${API}/admin/members/${memberId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(`Member ${status === 'suspended' ? 'suspended' : status === 'active' ? 'activated' : 'updated'}.`);
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status } : m)));
        if (selectedMember?.id === memberId) setSelectedMember((p) => ({ ...p, status }));
        setShowConfirm(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdating(false);
    }
  };

  // Remove member
  const removeMember = async (memberId) => {
    setUpdating(true);
    try {
      const { data } = await axios.delete(`${API}/admin/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success('Member removed.');
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setSelectedMember(null);
        setShowConfirm(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading members" submessage="Fetching member list..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/cell/dashboard')}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-blue-500" /> Cell Members
          </h1>
          <button onClick={fetchMembers} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive', 'suspended']).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition
                  ${statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>
                {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
              </button>
            ))}
          </div>
        </div>

        {/* Members list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Users size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No members found</p>
            <p className="text-sm mt-1">{search ? 'Try a different search' : 'No members in this filter'}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">Member</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((member) => (
                <li key={member.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition items-center">
                  {/* Name */}
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-400 shrink-0">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate sm:hidden">{member.email}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="hidden sm:block sm:col-span-3 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate flex items-center gap-1">
                      <Mail size={11} /> {member.email}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {member.phoneNumber}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[member.status] || STATUS_COLORS.inactive}`}>
                      {member.status === 'active' && <CheckCircle size={11} />}
                      {member.status === 'suspended' && <AlertTriangle size={11} />}
                      {member.status === 'inactive' && <Clock size={11} />}
                      {member.status}
                    </span>
                  </div>

                  {/* Joined */}
                  <div className="hidden sm:block sm:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-1 flex items-center justify-end gap-1">
                    <button onClick={() => viewMember(member)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="View details">
                      <Eye size={16} />
                    </button>
                    <div className="relative group">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                        <MoreVertical size={16} />
                      </button>
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                        {member.status !== 'active' && (
                          <button onClick={() => updateStatus(member.id, 'active')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition">
                            <UserCheck size={14} /> Activate
                          </button>
                        )}
                        {member.status !== 'suspended' && (
                          <button onClick={() => setShowConfirm({ type: 'suspend', id: member.id, name: `${member.firstName} ${member.lastName}` })}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                            <UserMinus size={14} /> Suspend
                          </button>
                        )}
                        <button onClick={() => setShowConfirm({ type: 'remove', id: member.id, name: `${member.firstName} ${member.lastName}` })}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                          <UserX size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* ── Member detail slide-over ────────────────── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedMember(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-2xl animate-slide-in">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Member Details</h2>
              <button onClick={() => setSelectedMember(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Header card */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-2xl font-bold text-blue-700 dark:text-blue-400 mx-auto">
                  {selectedMember.firstName?.[0]}{selectedMember.lastName?.[0]}
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                  {selectedMember.firstName} {selectedMember.lastName}
                </h3>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${STATUS_COLORS[selectedMember.status]}`}>
                  {selectedMember.status}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={15} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200">{selectedMember.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={15} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200">{selectedMember.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield size={15} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200">{selectedMember.cellName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200">
                    Joined {new Date(selectedMember.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Status actions */}
              <div className="flex gap-2">
                {selectedMember.status !== 'active' && (
                  <button onClick={() => updateStatus(selectedMember.id, 'active')} disabled={updating}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
                    <UserCheck size={14} /> Activate
                  </button>
                )}
                {selectedMember.status !== 'suspended' && (
                  <button onClick={() => updateStatus(selectedMember.id, 'suspended')} disabled={updating}
                    className="flex-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-60 flex items-center justify-center gap-1">
                    <UserMinus size={14} /> Suspend
                  </button>
                )}
              </div>

              {/* Attendance history */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1">
                  <Calendar size={14} /> Attendance History ({memberAttendance.length})
                </h4>
                {loadingAttendance ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
                ) : memberAttendance.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No records found.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
                    {memberAttendance.slice(0, 20).map((a, i) => (
                      <li key={a.id || i} className="flex items-center gap-3 py-2">
                        <CheckCircle size={14} className="text-green-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            {new Date(a.dateOfAttendance).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">{a.checkInTime?.slice(0, 5)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm dialog ─────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <AlertTriangle size={36} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">
              {showConfirm.type === 'remove' ? 'Remove Member?' : 'Suspend Member?'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              {showConfirm.type === 'remove'
                ? `This will permanently remove ${showConfirm.name} from the cell.`
                : `This will suspend ${showConfirm.name}'s account.`}
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Cancel
              </button>
              <button
                onClick={() => showConfirm.type === 'remove' ? removeMember(showConfirm.id) : updateStatus(showConfirm.id, 'suspended')}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-60">
                {updating ? 'Processing…' : showConfirm.type === 'remove' ? 'Remove' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CellMembers;
