/** Complains (route: /app/complains) — report a problem and see your past reports. */
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { complaintService, getErrorMessage } from '../../services/api.js';
import useLoad from '../../hooks/useLoad.js';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatTime } from '../../utils/formatTime.js';

const field = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60';

const Complains = () => {
  const list = useLoad(async () => (await complaintService.list()).data, []);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ tone: 'info', text: '' });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ tone: 'info', text: '' });
    try {
      await complaintService.create(form);
      setForm({ subject: '', message: '' });
      setMsg({ tone: 'success', text: 'Thanks, your complaint was sent.' });
      await list.reload();
    } catch (err) {
      setMsg({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Complains" subtitle="Tell us what went wrong. We read every one." icon={ShieldAlert} />
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
        <label htmlFor="c-sub" className="sr-only">Subject</label>
        <input id="c-sub" className={field} placeholder="Subject (3–120 characters)" maxLength={120} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
        <label htmlFor="c-msg" className="sr-only">Message</label>
        <textarea id="c-msg" rows={5} className={`${field} resize-y`} placeholder="Describe the problem (at least 10 characters)" maxLength={3000} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
        <Notice tone={msg.tone}>{msg.text}</Notice>
        <button type="submit" disabled={busy} className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Send complaint'}</button>
      </form>

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide !text-gray-400">Your complaints</h2>
      {list.loading ? <p className="text-sm">Loading…</p> : list.error ? <Notice tone="error">{list.error}</Notice> : (list.data || []).length === 0 ? <p className="text-sm">You haven't sent any complaints.</p> : (
        <ul className="space-y-2">
          {list.data.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-3">
                <strong className="break-words text-sm text-gray-100">{c.subject}</strong>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{c.status}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-xs">{c.message}</p>
              <div className="mt-1 text-[11px] text-gray-500">{formatTime(c.created_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Complains;
