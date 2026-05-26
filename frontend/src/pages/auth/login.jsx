import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicHeader from '../../components/PublicHeader.jsx';
import { authService, getErrorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Enter your username/email and password.');
      return;
    }

    setLoading(true);
    try {
      // API_DOCS.md: POST /auth/login
      await authService.login({ identifier, password });
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
          <h1 className="prefFont text-3xl font-extrabold text-gray-900">Login</h1>
          <p className="mt-1 text-sm text-gray-600">Access your chats securely.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-semibold text-gray-700">Email or Username</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
                placeholder="v1ron or v1ron@example.com"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              type="submit"
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-700">
            New here?{' '}
            <Link className="font-semibold text-red-600 hover:text-red-700" to="/signup">
              Create an account
            </Link>
          </p>

          <p className="mt-3 text-xs text-gray-500">
            API_DOCS.md notes: login attempts may rate-limit with `MELIODAS: Too many login attempts.`
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;