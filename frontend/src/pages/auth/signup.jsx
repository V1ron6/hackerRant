import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader.jsx';
import { authService, getErrorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { isValidEmail, isValidOtp, isValidUsername } from '../../utils/validators.js';

const fieldClass =
  'mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200';
const labelClass = 'text-sm font-semibold text-gray-700';

const Signup = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [step, setStep] = useState('form'); // 'form' -> 'otp'
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidUsername(form.username)) {
      return setError('Username must be 3–30 characters: letters, numbers, underscores.');
    }
    if (!isValidEmail(form.email)) return setError('Enter a valid email address.');
    if (!form.phone.trim()) return setError('Enter your phone number (e.g. +233201234567).');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      await authService.register({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setStep('otp');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidOtp(otp)) return setError('Enter the 6-digit code from your email.');

    setLoading(true);
    try {
      await authService.verifyOtp({ email: form.email.trim(), otp });
      await refresh();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h1 className="prefFont text-3xl font-extrabold text-gray-900">
            {step === 'form' ? 'Create account' : 'Verify your email'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {step === 'form'
              ? 'Your ticket is bound to this device and network.'
              : `We sent a 6-digit code to ${form.email}. It expires in 10 minutes.`}
          </p>

          {step === 'form' ? (
            <form className="mt-6 space-y-4" onSubmit={onRegister}>
              <div>
                <label className={labelClass}>Username</label>
                <input value={form.username} onChange={set('username')} className={fieldClass} placeholder="v1ron" autoComplete="username" maxLength={30} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input value={form.email} onChange={set('email')} type="email" className={fieldClass} placeholder="v1ron@example.com" autoComplete="email" />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input value={form.phone} onChange={set('phone')} type="tel" className={fieldClass} placeholder="+233201234567" autoComplete="tel" />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input value={form.password} onChange={set('password')} type="password" className={fieldClass} placeholder="At least 8 characters" autoComplete="new-password" />
              </div>

              {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

              <button disabled={loading} className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60" type="submit">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onVerify}>
              <div>
                <label className={labelClass}>6-digit code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${fieldClass} tracking-[0.4em]`}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>

              {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

              <button disabled={loading} className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60" type="submit">
                {loading ? 'Verifying…' : 'Verify and continue'}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-gray-700">
            Already have an account?{' '}
            <Link className="font-semibold text-red-600 hover:text-red-700" to="/login">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Signup;
