/**
 * AggressorWidget
 * buildi.txt: floating verifier indicator that periodically validates the ticket.
 * Implementation: lightweight polling of GET /auth/me (API_DOCS.md) on a random interval.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const randomMs = (minMinutes, maxMinutes) => {
  const min = minMinutes * 60 * 1000;
  const max = maxMinutes * 60 * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const AggressorWidget = () => {
  const { isAuthenticated, refresh } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | verifying | verified | invalid
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const color = useMemo(() => {
    if (!isAuthenticated) return 'bg-gray-300';
    if (status === 'verifying') return 'bg-red-500';
    if (status === 'verified') return 'bg-emerald-500';
    if (status === 'invalid') return 'bg-black';
    return 'bg-gray-400';
  }, [status, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;
    let cancelled = false;

    const run = async () => {
      try {
        setStatus('verifying');
        const res = await authService.getMe();
        if (cancelled) return;

        if (res?.success) {
          setStatus('verified');
          setLastCheckedAt(Date.now());
        } else {
          setStatus('invalid');
          await refresh();
          navigate('/', { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401) {
          setStatus('invalid');
          await refresh();
          navigate('/', { replace: true });
          return;
        }
        // Network/transient error: keep app usable.
        setStatus('verified');
        setLastCheckedAt(Date.now());
      } finally {
        if (cancelled) return;
        timeoutId = window.setTimeout(run, randomMs(4, 7));
      }
    };

    timeoutId = window.setTimeout(run, randomMs(1, 2));

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, navigate, refresh]);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
        <span className={`h-3.5 w-3.5 rounded-full ${color}`} />
        <div className="text-xs">
          <div className="font-semibold text-gray-900">Aggressor</div>
          <div className="text-gray-500">
            {status === 'verifying' ? 'verifying ticket…' : status === 'verified' ? 'ticket verified' : status === 'idle' ? 'standing by' : 'ticket invalid'}
            {lastCheckedAt ? ` • ${new Date(lastCheckedAt).toLocaleTimeString()}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AggressorWidget;
