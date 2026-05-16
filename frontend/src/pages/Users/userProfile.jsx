import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, ArrowLeft, Save, Lock, Calendar,
  CalendarCheck, Clock, CheckCircle, ChevronDown, Filter,
} from 'lucide-react';
import axios from 'axios';
import FormInput from '../../components/FormInput';
import Card from '../../components/Card';
import PasswordStrength from '../../components/PasswordStrength';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingScreen from '../../components/LoadingScreen';
import { useToast } from '../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const UserProfile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');

  // ── State ─────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  // Editable fields
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState({});

  // Password change
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState({});

  // Attendance history
  const [attendance, setAttendance] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterMonth, setFilterMonth] = useState('all');

  // ── Auth guard ────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    if (!user || !token) {
      toast.error('Please log in.');
      navigate('/login');
    }
  }, []);

  // ── Fetch profile & attendance ────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, attendRes] = await Promise.allSettled([
          axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/attendance/member/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
          const p = profileRes.value.data.data;
          setProfile(p);
          setEmail(p.email);
          setPhoneNumber(p.phoneNumber || '');
        }

        if (attendRes.status === 'fulfilled' && attendRes.value.data.success) {
          setAttendance(attendRes.value.data.data.attendance || []);
          setTotalRecords(attendRes.value.data.data.totalRecords || 0);
        }
      } catch {
        toast.error('Could not load data.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, []);

  // ── Filtered attendance ───────────────────────────
  const filteredAttendance = useMemo(() => {
    if (filterMonth === 'all') return attendance;
    return attendance.filter((a) => {
      const d = new Date(a.dateOfAttendance);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
    });
  }, [attendance, filterMonth]);

  // Unique months for filter
  const months = useMemo(() => {
    const set = new Set();
    attendance.forEach((a) => {
      const d = new Date(a.dateOfAttendance);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [attendance]);

  // ── Save profile ──────────────────────────────────
  const validateProfile = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (!phoneNumber.trim()) errs.phoneNumber = 'Phone is required';
    else if (!/^\+?\d{10,15}$/.test(phoneNumber.replace(/\s/g, ''))) errs.phoneNumber = '10–15 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const body = { email: email.trim().toLowerCase(), phoneNumber: phoneNumber.replace(/\s/g, '') };
      const { data } = await axios.put(`${API}/auth/update-profile`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(data.message || 'Profile updated.');
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, email: body.email, phoneNumber: body.phoneNumber }));
        setProfile((p) => ({ ...p, email: body.email, phoneNumber: body.phoneNumber }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────
  const validatePw = () => {
    const errs = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    else if (newPassword.length < 8) errs.newPassword = 'At least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword))
      errs.newPassword = 'Must include upper, lower, number & special char';
    if (confirmPassword !== newPassword) errs.confirmPassword = 'Passwords do not match';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;

    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/auth/update-profile`, {
        currentPassword, newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (data.success) {
        toast.success('Password changed.');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setShowPwSection(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading profile" submessage="Retrieving your information..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-sm">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={20} /> My Profile
          </h1>
          <div />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* ── Profile summary ──────────────────────────── */}
        {profile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 text-2xl font-bold">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    <Shield size={12} /> {profile.role}
                  </span>
                  {profile.cellName && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">· {profile.cellName}</span>
                  )}
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <CheckCircle size={12} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar size={12} /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit profile ─────────────────────────────── */}
        <Card title="Edit Profile" icon={Mail}>
          <form onSubmit={handleSaveProfile} className="space-y-1">
            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
              placeholder="you@example.com"
              error={errors.email}
              required
              icon={Mail}
            />
            <FormInput
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); if (errors.phoneNumber) setErrors((p) => ({ ...p, phoneNumber: '' })); }}
              placeholder="+233201234567"
              error={errors.phoneNumber}
              required
              icon={Phone}
            />
            <button type="submit" disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-60 flex items-center gap-2">
              {saving ? <LoadingSpinner message="" /> : <><Save size={16} /> Save Changes</>}
            </button>
          </form>
        </Card>

        {/* ── Change password ──────────────────────────── */}
        <Card title="Change Password" icon={Lock}>
          {!showPwSection ? (
            <button onClick={() => setShowPwSection(true)}
              className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium">
              Change your password →
            </button>
          ) : (
            <form onSubmit={handleChangePw} className="space-y-1">
              <FormInput
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); if (pwErrors.currentPassword) setPwErrors((p) => ({ ...p, currentPassword: '' })); }}
                placeholder="Enter current password"
                error={pwErrors.currentPassword}
                required
              />
              <FormInput
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (pwErrors.newPassword) setPwErrors((p) => ({ ...p, newPassword: '' })); }}
                placeholder="Min 8 characters"
                error={pwErrors.newPassword}
                required
                minLength={8}
              />
              {newPassword && <PasswordStrength password={newPassword} />}
              <FormInput
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (pwErrors.confirmPassword) setPwErrors((p) => ({ ...p, confirmPassword: '' })); }}
                placeholder="Re-enter new password"
                error={pwErrors.confirmPassword}
                required
              />
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-60 flex items-center gap-2">
                  {saving ? <LoadingSpinner message="" /> : <><Lock size={16} /> Update Password</>}
                </button>
                <button type="button"
                  onClick={() => { setShowPwSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwErrors({}); }}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* ── Attendance history ───────────────────────── */}
        <Card title="Attendance History" icon={CalendarCheck}
          action={
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalRecords} total record{totalRecords !== 1 ? 's' : ''}
            </span>
          }>

          {/* Month filter */}
          {months.length > 1 && (
            <div className="mb-4 flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <div className="relative">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                  className="appearance-none border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 pr-8 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="all">All months</option>
                  {months.map((m) => {
                    const [y, mo] = m.split('-');
                    const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{label}</option>;
                  })}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {filteredAttendance.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <CalendarCheck size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No records found</p>
              <p className="text-sm mt-1">
                {filterMonth !== 'all' ? 'Try a different month' : 'Your attendance will appear here after check-in'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {filteredAttendance.map((rec, i) => {
                const date = new Date(rec.dateOfAttendance);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <li key={rec.id || i} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {dayName}, {dateStr}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> Checked in at {rec.checkInTime?.slice(0, 5)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
};

export default UserProfile;
