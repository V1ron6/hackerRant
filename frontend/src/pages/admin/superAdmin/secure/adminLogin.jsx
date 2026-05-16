import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowRight, KeyRound, Lock } from 'lucide-react';
import axios from 'axios';
import FormInput from '../../../../components/FormInput';
import PasswordStrength from '../../../../components/PasswordStrength';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const VIEW = {
  LOGIN: 'login',
  FORGOT: 'forgot',
  RESET: 'reset',
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [view, setView] = useState(VIEW.LOGIN);
  const [loading, setLoading] = useState(false);

  // ── Login state ───────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  // ── Forgot / reset state ──────────────────────────
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetErrors, setResetErrors] = useState({});

  const clearErrors = () => { setErrors({}); setForgotError(''); setResetErrors({}); };

  // ── Validate login ────────────────────────────────
  const validateLogin = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Login handler ─────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/admin/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (data.success) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        toast.success(data.message || 'Login successful!');

        const role = data.data.user.role;
        const routes = {
          superAdmin: '/admin/dashboard',
          cellLeader: '/cell/dashboard',
          usher: '/usher/dashboard'
        };
        setTimeout(() => navigate(routes[role] || '/admin/dashboard'), 800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ───────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError('Email is required'); return; }

    setLoading(true);
    setForgotError('');
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, {
        email: forgotEmail.trim().toLowerCase(),
        userType: 'privileged',
      });
      if (data.success) {
        toast.success(data.message || 'Reset code sent to your email.');
        setView(VIEW.RESET);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password ────────────────────────────────
  const validateReset = () => {
    const errs = {};
    if (!resetOtp.trim()) errs.otp = 'OTP is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    else if (newPassword.length < 8) errs.newPassword = 'At least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword))
      errs.newPassword = 'Must include upper, lower, number & special char';
    if (confirmNewPassword !== newPassword) errs.confirmNewPassword = 'Passwords do not match';
    setResetErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateReset()) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, {
        email: forgotEmail.trim().toLowerCase(),
        otp: resetOtp.trim(),
        newPassword,
        userType: 'privileged',
      });
      if (data.success) {
        toast.success(data.message || 'Password reset! Please log in.');
        setView(VIEW.LOGIN);
        setPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════
  //  FORGOT PASSWORD VIEW
  // ════════════════════════════════════════════════════
  if (view === VIEW.FORGOT) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
            <p className="text-gray-400 mt-2 text-sm">Enter your admin email to receive a reset code</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <FormInput
              label="Email"
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); if (forgotError) setForgotError(''); }}
              placeholder="admin@hgbmi.church"
              error={forgotError}
              required
              icon={Mail}
            />

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner message="" /> : 'Send Reset Code'}
            </button>
          </form>

          <button type="button" onClick={() => { clearErrors(); setView(VIEW.LOGIN); }}
            className="mt-6 w-full text-center text-sm text-gray-400 hover:text-gray-300">
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  //  RESET PASSWORD VIEW
  // ════════════════════════════════════════════════════
  if (view === VIEW.RESET) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            <p className="text-gray-400 mt-2 text-sm">
              Enter the code sent to <strong className="text-gray-200">{forgotEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-1">
            <FormInput
              label="OTP Code"
              value={resetOtp}
              onChange={(e) => { setResetOtp(e.target.value); if (resetErrors.otp) setResetErrors(p => ({ ...p, otp: '' })); }}
              placeholder="Enter 6-digit code"
              error={resetErrors.otp}
              required
              maxLength={6}
            />

            <FormInput
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); if (resetErrors.newPassword) setResetErrors(p => ({ ...p, newPassword: '' })); }}
              placeholder="Min 8 characters"
              error={resetErrors.newPassword}
              required
              minLength={8}
            />

            {newPassword && <PasswordStrength password={newPassword} />}

            <FormInput
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => { setConfirmNewPassword(e.target.value); if (resetErrors.confirmNewPassword) setResetErrors(p => ({ ...p, confirmNewPassword: '' })); }}
              placeholder="Re-enter new password"
              error={resetErrors.confirmNewPassword}
              required
            />

            <button type="submit" disabled={loading}
              className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner message="" /> : 'Reset Password'}
            </button>
          </form>

          <button type="button" onClick={() => { clearErrors(); setView(VIEW.FORGOT); }}
            className="mt-6 w-full text-center text-sm text-gray-400 hover:text-gray-300">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  //  ADMIN LOGIN VIEW (default)
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 mt-2 text-sm">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-1" noValidate>
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
            placeholder="admin@hgbmi.church"
            error={errors.email}
            required
            icon={Mail}
          />

          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
            placeholder="Enter admin password"
            error={errors.password}
            required
          />

          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => { clearErrors(); setForgotEmail(email); setView(VIEW.FORGOT); }}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <LoadingSpinner message="" />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8">
          This portal is restricted to admins and cell leaders.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
