/** Threads (route: /app/threads) — community discussions; start one or open one. */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, MessagesSquare, Plus } from 'lucide-react';
import { getErrorMessage, threadService } from '../../services/api.js';
import Avatar from '../../components/Avatar.jsx';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatTime } from '../../utils/formatTime.js';

const field = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60';

const Threads = () => {
  const [threads, setThreads] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = useCallback(async (from) => {
    try {
      const res = await threadService.list(from);
      setThreads((prev) => (from ? [...prev, ...res.data.threads] : res.data.threads));
      setCursor(res.data.nextCursor);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setMore(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormErr('');
    try {
      const res = await threadService.create(form);
      setThreads((prev) => [{ ...res.data, replyCount: 0 }, ...prev]);
      setForm({ title: '', body: '' });
      setOpen(false);
    } catch (err) {
      setFormErr(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Threads" subtitle="Ask a question or start a discussion." icon={MessagesSquare}>
        <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> New thread
        </button>
      </PageHeader>

      {open ? (
        <form onSubmit={create} className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <label htmlFor="t-title" className="sr-only">Title</label>
          <input id="t-title" className={field} placeholder="Title (3–150 characters)" value={form.title} maxLength={150} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <label htmlFor="t-body" className="sr-only">Details</label>
          <textarea id="t-body" rows={4} className={`${field} resize-y`} placeholder="Details" value={form.body} maxLength={3000} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required />
          <Notice tone="error">{formErr}</Notice>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Posting…' : 'Post thread'}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300">Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="space-y-2">
        {loading ? <p className="text-sm">Loading threads…</p> : error ? <Notice tone="error">{error}</Notice> : threads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm">No threads yet. Start the first one.</div>
        ) : threads.map((t) => (
          <Link key={t.id} to={`/app/threads/${t.id}`} className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.07]">
            <div className="flex items-start gap-3">
              <Avatar src={t.author?.avatar_url} name={t.author?.username} size={36} />
              <div className="min-w-0 flex-1">
                <strong className="block break-words text-sm text-gray-100">{t.title}</strong>
                <p className="mt-0.5 line-clamp-2 break-words text-xs">{t.body}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                  <span>@{t.author?.username || 'deleted'}</span><span>{formatTime(t.created_at)}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{t.replyCount}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {cursor ? (
          <button type="button" disabled={more} onClick={() => { setMore(true); load(cursor); }} className="w-full rounded-lg border border-white/10 py-2 text-sm text-gray-300 disabled:opacity-60">
            {more ? 'Loading…' : 'Load more'}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Threads;
