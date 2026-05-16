import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Users, ArrowRight, ChevronDown } from 'lucide-react';
import axios from 'axios';
import FormInput from '../../components/FormInput';
import PasswordStrength from '../../components/PasswordStrength';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const Signup = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // ── Form state ───────────────────────────────────────
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    cellName: '',
  });

  const [errors, setErrors] = useState({});
  const [cells, setCells] = useState([]);
  const [loadingCells, setLoadingCells] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── OTP verification state ───────────────────────────
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // ── Fetch cells on mount ─────────────────────────────
  useEffect(() => {
    const fetchCells = async () => {
      try {
        const { data } = await axios.get(`${API}/auth/cells`);
        if (data.success) {
          setCells(data.data);
        }
      } catch {
        toast.error('Could not load cell groups. Please refresh.');
      } finally {
        setLoadingCells(false);
      }
    };
    fetchCells();
  }, []);

  // ── Helpers ──────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};

    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    else if (!/^[A-Za-z]{2,50}$/.test(form.firstName.trim()))
      errs.firstName = '2–50 letters only';

    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    else if (!/^[A-Za-z]{2,50}$/.test(form.lastName.trim()))
      errs.lastName = '2–50 letters only';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email';

    if (!form.phoneNumber.trim()) errs.phoneNumber = 'Phone number is required';
    else if (!/^\+?\d{10,15}$/.test(form.phoneNumber.replace(/\s/g, '')))
      errs.phoneNumber = '10–15 digits (optional + prefix)';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password))
      errs.password = 'Must include upper, lower, number & special char';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.confirmPassword !== form.password)
      errs.confirmPassword = 'Passwords do not match';

    if (!form.cellName) errs.cellName = 'Please select a cell group';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit registration ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/auth/register`, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.replace(/\s/g, ''),
        password: form.password,
        cellName: form.cellName,
      });

      if (data.success) {
        toast.success(data.message || 'Registration successful! Check your email for OTP.');
        setRegisteredEmail(form.email.trim().toLowerCase());
        setShowOtp(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }

    setVerifying(true);
    setOtpError('');
    try {
      const { data } = await axios.post(`${API}/auth/verify-email`, {
        email: registeredEmail,
        otp: otp.trim(),
      });

      if (data.success) {
        toast.success('Email verified! Redirecting to login…');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────
  const handleResendOtp = async () => {
    setResending(true);
    try {
      const { data } = await axios.post(`${API}/auth/resend-otp`, {
        email: registeredEmail,
      });
      if (data.success) toast.success('New OTP sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // ── OTP Verification View ───────────────────────────
  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              We sent a 6-digit code to <strong>{registeredEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <FormInput
              label="OTP Code"
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (otpError) setOtpError('');
              }}
              placeholder="Enter 6-digit code"
              error={otpError}
              required
              maxLength={6}
            />

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? <LoadingSpinner message="" /> : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form View ──────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Join the HGBMI Church community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1" noValidate>
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="First Name"
              value={form.firstName}
              onChange={handleChange('firstName')}
              placeholder="John"
              error={errors.firstName}
              required
              icon={User}
            />
            <FormInput
              label="Last Name"
              value={form.lastName}
              onChange={handleChange('lastName')}
              placeholder="Doe"
              error={errors.lastName}
              required
              icon={User}
            />
          </div>

          {/* Email */}
          <FormInput
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="john.doe@example.com"
            error={errors.email}
            required
            icon={Mail}
          />

          {/* Phone */}
          <FormInput
            label="Phone Number"
            type="tel"
            value={form.phoneNumber}
            onChange={handleChange('phoneNumber')}
            placeholder="+233201234567"
            error={errors.phoneNumber}
            required
            icon={Phone}
          />

          {/* Cell group select */}
          <div className="mb-4">
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Cell Group <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 text-gray-400" size={20} />
              <select
                value={form.cellName}
                onChange={handleChange('cellName')}
                disabled={loadingCells}
                className={`
                  w-full border rounded-lg p-3 pl-10 pr-10 appearance-none transition duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  ${errors.cellName ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-600'}
                  ${loadingCells ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                <option value="">
                  {loadingCells ? 'Loading cells…' : 'Select your cell group'}
                </option>
                {cells.map((cell) => (
                  <option key={cell.id} value={cell.name}>
                    {cell.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
            </div>
            {errors.cellName && (
              <p className="mt-2 text-sm text-red-600">{errors.cellName}</p>
            )}
          </div>

          {/* Password */}
          <FormInput
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            placeholder="Min 8 characters"
            error={errors.password}
            required
            minLength={8}
          />

          {/* Password strength meter */}
          {form.password && <PasswordStrength password={form.password} />}

          {/* Confirm password */}
          <FormInput
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="Re-enter password"
            error={errors.confirmPassword}
            required
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <LoadingSpinner message="" />
            ) : (
              <>
                Sign Up <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-red-500 hover:text-red-600 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
