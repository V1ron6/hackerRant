/** One thread with its replies (route: /app/threads/:id). */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getErrorMessage, threadService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useLoad from '../../hooks/useLoad.js';
import Avatar from '../../components/Avatar.jsx';
import Notice from '../../components/Notice.jsx';
import { formatTime } from '../../utils/formatTime.js';

const Author = ({ a, at }) => (
  <div className="flex items-center gap-2.5">
    <Avatar src={a?.avatar_url} name={a?.username} size={30} />
    {a ? <Link to={`/app/u/${a.username}`} className="text-sm font-semibold text-gray-100 hover:underline">@{a.username}</Link> : <span className="text-sm text-gray-500">deleted</span>}
    <span className="text-xs text-gray-500">{formatTime(at)}</span>
  </div>
);

const ThreadDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: t, setData, loading, error } = useLoad(async () => (await threadService.get(id)).data, [id]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const reply = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const res = await threadService.reply(id, body);
      setData((cur) => ({ ...cur, replies: [...cur.replies, res.data], replyCount: cur.replyCount + 1 }));
      setBody('');
    } catch (error2) {
      setErr(getErrorMessage(error2));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this thread and all its replies?')) return;
    try {
      await threadService.remove(id);
      navigate('/app/threads', { replace: true });
    } catch (error2) {
      setErr(getErrorMessage(error2));
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/app/threads" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} /> All threads</Link>
      {loading ? <p className="text-sm">Loading thread…</p> : error ? <Notice tone="error">{error}</Notice> : (
        <>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="prefFont break-words text-xl font-extrabold">{t.title}</h1>
              {t.ownerId === user.id ? <button type="button" onClick={remove} aria-label="Delete thread" className="hr-icon-button shrink-0"><Trash2 size={16} /></button> : null}
            </div>
            <div className="mt-2"><Author a={t.author} at={t.created_at} /></div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm !text-gray-200">{t.body}</p>
          </article>

          <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide !text-gray-400">{t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}</h2>
          <div className="space-y-2">
            {t.replies.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <Author a={r.author} at={r.created_at} />
                <p className="mt-2 whitespace-pre-wrap break-words text-sm !text-gray-200">{r.body}</p>
              </div>
            ))}
          </div>

          {t.is_open === false ? <Notice className="mt-4">This thread is closed.</Notice> : (
            <form onSubmit={reply} className="mt-4 space-y-3">
              <label htmlFor="reply" className="sr-only">Your reply</label>
              <textarea id="reply" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Write a reply…"
                className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60" required />
              <Notice tone="error">{err}</Notice>
              <button type="submit" disabled={busy || !body.trim()} className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Reply'}</button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default ThreadDetail;
