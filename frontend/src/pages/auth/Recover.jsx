import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader.jsx';
import { authService, getErrorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const fieldClass = 'mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200';
const labelClass = 'text-sm font-semibold text-gray-700';

/** Public page: regain access from a new device (emailed code + password → new ticket). */
const Recover = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanEmail = email.trim().toLowerCase();

  const onRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Enter a valid email address.');
    setLoading(true);
    try {
      await authService.requestReset(cleanEmail);
      setStep('confirm');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code from your email.');
    if (!password) return setError('Enter your password.');
    setLoading(true);
    try {
      await authService.confirmReset({ email: cleanEmail, otp, password });
      await refresh();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const errBox = error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null;
  const btn = 'w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h1 className="prefFont text-3xl font-extrabold text-gray-900">Recover access</h1>
          <p className="mt-1 text-sm text-gray-600">
            {step === 'email'
              ? 'On a new device or lost your ticket? We will email you a code.'
              : 'If that account exists, a code is on its way. Enter it with your password. Every old device is signed out.'}
          </p>

          {step === 'email' ? (
            <form className="mt-6 space-y-4" onSubmit={onRequest}>
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} autoComplete="email" placeholder="you@example.com" />
              </div>
              {errBox}
              <button disabled={loading} className={btn} type="submit">{loading ? 'Sending…' : 'Send code'}</button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onConfirm}>
              <div>
                <label htmlFor="otp" className={labelClass}>6-digit code</label>
                <input id="otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className={`${fieldClass} tracking-[0.4em]`} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} autoComplete="current-password" />
              </div>
              {errBox}
              <button disabled={loading} className={btn} type="submit">{loading ? 'Checking…' : 'Recover and sign in'}</button>
              <button type="button" onClick={() => { setStep('email'); setError(''); }} className="text-sm text-gray-600 underline">Use a different email</button>
            </form>
          )}

          <p className="mt-6 text-sm text-gray-700">
            Remembered it? <Link className="font-semibold text-red-600 hover:text-red-700" to="/login">Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Recover;
