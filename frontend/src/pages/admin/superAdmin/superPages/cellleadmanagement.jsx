import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, UserPlus, Search, X, Edit2, Trash2,
  Mail, Phone, Calendar, Building2, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Eye, EyeOff, Key,
} from 'lucide-react';
import axios from 'axios';
import FormInput from '../../../../components/FormInput';
import PasswordStrength from '../../../../components/PasswordStrength';
import Card from '../../../../components/Card';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import LoadingScreen from '../../../../components/LoadingScreen';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const ROLE_COLORS = {
  cellLeader: 'bg-purple-900/40 text-purple-400',
  usher: 'bg-blue-900/40 text-blue-400',
  superAdmin: 'bg-yellow-900/40 text-yellow-400',
};

const CellLeadManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [cells, setCells] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '', role: 'cellLeader', cellName: '' });
  const [formErrors, setFormErrors] = useState({});

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Generate password
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (!token || user.role !== 'superAdmin') {
      toast.error('Super Admin access required.');
      navigate('/admin/login');
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, cellsRes] = await Promise.allSettled([
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/cells`, { headers }),
      ]);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.data || []);
      if (cellsRes.status === 'fulfilled') setCells(cellsRes.value.data.data || []);
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const c = { all: users.length, cellLeader: 0, usher: 0 };
    users.forEach((u) => { if (c[u.role] !== undefined) c[u.role]++; });
    return c;
  }, [users]);

  // Open create / edit modal
  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '', role: 'cellLeader', cellName: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phoneNumber: u.phoneNumber || '', password: '', role: u.role, cellName: u.cellName || '' });
    setFormErrors({});
    setShowModal(true);
  };

  // Generate password
  const generatePassword = async () => {
    setGenLoading(true);
    try {
      const { data } = await axios.get(`${API}/auth/generate-password?length=14`);
      if (data.success) setForm((p) => ({ ...p, password: data.data.password }));
    } catch { toast.error('Failed to generate password.'); }
    finally { setGenLoading(false); }
  };

  // Validate
  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!editing) {
      if (!form.email.trim()) errs.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
      if (!form.password) errs.password = 'Required';
      else if (form.password.length < 8) errs.password = 'Min 8 chars';
    }
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'Required';
    if (form.role === 'cellLeader' && !form.cellName) errs.cellName = 'Required for cell leader';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save (create / update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editing) {
        const body = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: form.phoneNumber.replace(/\s/g, ''),
          cellName: form.role === 'cellLeader' ? form.cellName : undefined,
        };
        const { data } = await axios.put(`${API}/admin/users/${editing.id}`, body, { headers });
        if (data.success) {
          toast.success('User updated.');
          setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...data.data } : u)));
          setShowModal(false);
        }
      } else {
        const body = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.phoneNumber.replace(/\s/g, ''),
          password: form.password,
          role: form.role,
          cellName: form.role === 'cellLeader' ? form.cellName : undefined,
        };
        const { data } = await axios.post(`${API}/admin/users`, body, { headers });
        if (data.success) {
          toast.success(`${form.role === 'cellLeader' ? 'Cell Leader' : 'Usher'} created.`);
          setUsers((prev) => [data.data, ...prev]);
          setShowModal(false);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  // Toggle active
  const toggleActive = async (u) => {
    try {
      const { data } = await axios.put(`${API}/admin/users/${u.id}`, { isActive: !u.isActive }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(`User ${!u.isActive ? 'activated' : 'deactivated'}.`);
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)));
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
  };

  // Delete
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const { data } = await axios.delete(`${API}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success('User removed.');
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setConfirmDelete(null);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
    finally { setDeleting(false); }
  };

  if (loading) return <LoadingScreen message="Loading cell leaders" submessage="Fetching privileged users..." />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} className="text-blue-400" /> Cell Leads & Ushers
          </h1>
          <button onClick={openCreate}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg transition font-medium">
            <UserPlus size={15} /> Create
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {['all', 'cellLeader', 'usher'].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                  roleFilter === r ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}>
                {r === 'all' ? 'All' : r === 'cellLeader' ? 'Cell Leaders' : 'Ushers'} ({counts[r]})
              </button>
            ))}
          </div>
        </div>

        {/* User list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Shield size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No users found</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">User</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <ul className="divide-y divide-gray-800">
              {filtered.map((u) => (
                <li key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 hover:bg-gray-800/30 transition items-center">
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-900/40 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{u.firstName} {u.lastName}</p>
                      {u.cellName && <p className="text-[11px] text-gray-500">{u.cellName}</p>}
                    </div>
                  </div>
                  <div className="hidden md:block md:col-span-3 min-w-0">
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1"><Mail size={11} /> {u.email}</p>
                    {u.phoneNumber && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={11} /> {u.phoneNumber}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-800 text-gray-400'}`}>
                      <Shield size={11} /> {u.role === 'cellLeader' ? 'Cell Leader' : u.role === 'usher' ? 'Usher' : u.role}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <button onClick={() => toggleActive(u)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition cursor-pointer ${
                        u.isActive ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
                      }`}>
                      {u.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition" title="Edit">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setConfirmDelete(u)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* ── Create / Edit Modal ───────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg">
                {editing ? 'Edit User' : 'Create Privileged User'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="First Name" value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  error={formErrors.firstName} required />
                <FormInput label="Last Name" value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  error={formErrors.lastName} required />
              </div>
              {!editing && (
                <FormInput label="Email" type="email" value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  error={formErrors.email} required icon={Mail} />
              )}
              <FormInput label="Phone Number" type="tel" value={form.phoneNumber}
                onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                error={formErrors.phoneNumber} required icon={Phone} placeholder="+233201234567" />

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <div className="flex gap-2">
                  {['cellLeader', 'usher'].map((r) => (
                    <button key={r} type="button"
                      onClick={() => !editing && setForm((p) => ({ ...p, role: r }))}
                      disabled={!!editing}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                        form.role === r
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      } ${editing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      {r === 'cellLeader' ? 'Cell Leader' : 'Usher'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cell (for cellLeader) */}
              {form.role === 'cellLeader' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cell Group *</label>
                  <select value={form.cellName}
                    onChange={(e) => setForm((p) => ({ ...p, cellName: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select cell…</option>
                    {cells.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {formErrors.cellName && <p className="text-xs text-red-400 mt-1">{formErrors.cellName}</p>}
                </div>
              )}

              {/* Password (create only) */}
              {!editing && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-300">Password *</label>
                    <button type="button" onClick={generatePassword} disabled={genLoading}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                      <Key size={12} /> {genLoading ? 'Generating…' : 'Generate strong'}
                    </button>
                  </div>
                  <FormInput type="password" value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    error={formErrors.password} required minLength={8}
                    placeholder="Min 8 characters" />
                  {form.password && <PasswordStrength password={form.password} />}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm ────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full text-center">
            <AlertTriangle size={36} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold">Delete User?</h3>
            <p className="text-sm text-gray-400 mt-2">
              This will permanently remove <span className="text-white font-medium">{confirmDelete.firstName} {confirmDelete.lastName}</span> ({confirmDelete.role}).
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CellLeadManagement;
