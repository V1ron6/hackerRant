import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, ArrowLeft, Save, Lock, Calendar,
} from 'lucide-react';
import axios from 'axios';
import FormInput from '../../components/FormInput';
import Card from '../../components/Card';
import PasswordStrength from '../../components/PasswordStrength';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingScreen from '../../components/LoadingScreen';
import { useToast } from '../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const UsherProfile = () => {
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
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState({});

  // ── Auth guard ────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    if (!user || !token || (user.role !== 'usher' && user.role !== 'superAdmin')) {
      toast.error('Unauthorized.');
      navigate('/login');
    }
  }, []);

  // ── Fetch profile ─────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setProfile(data.data);
          setEmail(data.data.email);
          setPhoneNumber(data.data.phoneNumber || '');
        }
      } catch {
        toast.error('Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, []);

  // ── Validate & save profile ───────────────────────
  const validateProfile = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (!phoneNumber.trim()) errs.phoneNumber = 'Phone is required';
    else if (!/^\+?\d{10,15}$/.test(phoneNumber.replace(/\s/g, '')))
      errs.phoneNumber = '10–15 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const body = {
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.replace(/\s/g, ''),
      };
      const { data } = await axios.put(`${API}/auth/update-profile`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(data.message || 'Profile updated.');
        // Update local storage
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

  // ── Validate & change password ────────────────────
  const validatePassword = () => {
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/auth/update-profile`, {
        currentPassword,
        newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (data.success) {
        toast.success('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
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
          <button onClick={() => navigate('/usher/dashboard')}
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
        {/* ── Profile summary card ─────────────────────── */}
        {profile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    <Shield size={12} /> {profile.role}
                  </span>
                  {profile.cellName && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      · {profile.cellName}
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
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-60 flex items-center gap-2">
              {saving ? <LoadingSpinner message="" /> : <><Save size={16} /> Save Changes</>}
            </button>
          </form>
        </Card>

        {/* ── Change password ──────────────────────────── */}
        <Card title="Change Password" icon={Lock}>
          {!showPasswordSection ? (
            <button
              onClick={() => setShowPasswordSection(true)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              Change your password →
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-1">
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
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-60 flex items-center gap-2">
                  {saving ? <LoadingSpinner message="" /> : <><Lock size={16} /> Update Password</>}
                </button>
                <button type="button" onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwErrors({}); }}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
};

export default UsherProfile;
