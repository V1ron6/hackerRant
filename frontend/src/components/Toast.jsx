/**
 * Toast
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext } from './ToastContext.jsx';

const typeConfig = {
  success: { Icon: CheckCircle, border: 'border-emerald-500', text: 'text-emerald-800', bg: 'bg-emerald-50' },
  error: { Icon: XCircle, border: 'border-red-500', text: 'text-red-800', bg: 'bg-red-50' },
  warning: { Icon: AlertTriangle, border: 'border-amber-500', text: 'text-amber-800', bg: 'bg-amber-50' },
  info: { Icon: Info, border: 'border-blue-500', text: 'text-blue-800', bg: 'bg-blue-50' },
};

const ToastItem = ({ toast, onClose }) => {
  const cfg = typeConfig[toast.type] || typeConfig.info;
  const Icon = cfg.Icon;

  useEffect(() => {
    if (!toast.duration) return;
    const id = window.setTimeout(() => onClose(toast.id), toast.duration);
    return () => window.clearTimeout(id);
  }, [toast.duration, toast.id, onClose]);

  return (
    <div className={`flex items-start gap-3 rounded-xl border-l-4 ${cfg.border} ${cfg.bg} px-4 py-3 shadow-sm`}>
      <Icon size={18} className={`${cfg.text} mt-0.5`} />
      <div className="flex-1">
        <div className={`text-sm font-semibold ${cfg.text}`}>{toast.message}</div>
      </div>
      <button onClick={() => onClose(toast.id)} className="rounded-md p-1 text-gray-500 hover:bg-black/5">
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 4000) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      success: (m, d) => push('success', m, d),
      error: (m, d) => push('error', m, d),
      warning: (m, d) => push('warning', m, d),
      info: (m, d) => push('info', m, d),
      remove,
      clear: () => setToasts([]),
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
