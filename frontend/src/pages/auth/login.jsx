import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import axios from 'axios';
import FormInput from '../../components/FormInput';
import PasswordStrength from '../../components/PasswordStrength';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

// ── View constants ────────────────────────────────────
const VIEW = {
  LOGIN: 'login',
  VERIFY: 'verify',           // unverified user → enter OTP
  FORGOT: 'forgot',           // enter email to receive reset OTP
  RESET: 'reset',             // enter OTP + new password
};

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // ── Shared state ──────────────────────────────────
  const [view, setView] = useState(VIEW.LOGIN);
  const [loading, setLoading] = useState(false);

  // ── Login state ───────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  // ── OTP verification state (unverified user) ─────
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);

  // ── Forgot / reset password state ────────────────
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetErrors, setResetErrors] = useState({});

  // ── Helpers ───────────────────────────────────────
  const clearErrors = () => { setErrors({}); setOtpError(''); setForgotError(''); setResetErrors({}); };

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
      const { data } = await axios.post(`${API}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (data.success) {
        // Persist auth
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        if (rememberMe) localStorage.setItem('rememberMe', 'true');

        toast.success(data.message || 'Login successful!');

        // Role-based redirect
        const role = data.data.user.role;
        const routes = {
          member: '/dashboard'
        };
        setTimeout(() => navigate(routes[role] || '/dashboard'), 800);
      }
    } catch (err) {
      const res = err.response?.data;

      // If user is unverified, switch to OTP view
      if (res?.requiresVerification) {
        toast.warning(res.message || 'Please verify your email first.');
        setView(VIEW.VERIFY);
      } else {
        toast.error(res?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Verify email OTP (unverified user) ────────────
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { setOtpError('Please enter the OTP'); return; }

    setLoading(true);
    setOtpError('');
    try {
      const { data } = await axios.post(`${API}/auth/verify-email`, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (data.success) {
        toast.success('Email verified! You can now log in.');
        setOtp('');
        setView(VIEW.LOGIN);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await axios.post(`${API}/auth/resend-otp`, { email: email.trim().toLowerCase() });
      toast.success('New OTP sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // ── Forgot password ──────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError('Email is required'); return; }

    setLoading(true);
    setForgotError('');
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, {
        email: forgotEmail.trim().toLowerCase(),
        userType: 'member',
      });
      if (data.success) {
        toast.success(data.message || 'Reset OTP sent to your email.');
        setView(VIEW.RESET);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Could not send reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password ───────────────────────────────
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
        userType: 'member',
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
  //  VERIFY EMAIL VIEW
  // ════════════════════════════════════════════════════
  if (view === VIEW.VERIFY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyEmail} className="space-y-5">
            <FormInput
              label="OTP Code"
              value={otp}
              onChange={(e) => { setOtp(e.target.value); if (otpError) setOtpError(''); }}
              placeholder="Enter 6-digit code"
              error={otpError}
              required
              maxLength={6}
            />

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner message="" /> : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the code?{' '}
            <button type="button" onClick={handleResendOtp} disabled={resending}
              className="text-red-500 hover:text-red-600 font-medium disabled:opacity-50">
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          </div>

          <button type="button" onClick={() => { clearErrors(); setView(VIEW.LOGIN); }}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  //  FORGOT PASSWORD VIEW
  // ════════════════════════════════════════════════════
  if (view === VIEW.FORGOT) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Enter your email and we'll send a reset code
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <FormInput
              label="Email"
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); if (forgotError) setForgotError(''); }}
              placeholder="john.doe@example.com"
              error={forgotError}
              required
              icon={Mail}
            />

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner message="" /> : 'Send Reset Code'}
            </button>
          </form>

          <button type="button" onClick={() => { clearErrors(); setView(VIEW.LOGIN); }}
            className="mt-6 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Enter the code sent to <strong>{forgotEmail}</strong>
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
              className="w-full py-3 mt-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner message="" /> : 'Reset Password'}
            </button>
          </form>

          <button type="button" onClick={() => { clearErrors(); setView(VIEW.FORGOT); }}
            className="mt-6 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  //  LOGIN VIEW (default)
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Sign in to your HGBMI account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-1" noValidate>
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
            placeholder="john.doe@example.com"
            error={errors.email}
            required
            icon={Mail}
          />

          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
            placeholder="Enter your password"
            error={errors.password}
            required
          />

          {/* Remember me + forgot */}
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => { clearErrors(); setForgotEmail(email); setView(VIEW.FORGOT); }}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-red-500 hover:text-red-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
