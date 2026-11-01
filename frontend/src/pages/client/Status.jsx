/** Status (route: /app/status) — 24-hour posts: text, image, video or audio. */
import { useRef, useState } from 'react';
import { CircleDot, ImagePlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getErrorMessage, statusService, uploadService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useLoad from '../../hooks/useLoad.js';
import Avatar from '../../components/Avatar.jsx';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatTime } from '../../utils/formatTime.js';

const TEXT_MAX = 500;

const Media = ({ post }) => {
  if (post.kind === 'image') return <img src={post.media_url} alt="Status attachment" loading="lazy" className="mt-3 max-h-96 w-full rounded-xl object-contain bg-black/30" />;
  if (post.kind === 'video') return <video src={post.media_url} controls preload="metadata" className="mt-3 max-h-96 w-full rounded-xl bg-black" />;
  if (post.kind === 'audio') return <audio src={post.media_url} controls preload="metadata" className="mt-3 w-full" />;
  return null;
};

const Status = () => {
  const { user } = useAuth();
  const feed = useLoad(async () => (await statusService.list()).data, []);
  const fileRef = useRef(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const post = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      let payload;
      if (file) {
        const up = await uploadService.upload(file);
        payload = { kind: up.data.kind, text: text.trim() || undefined, media_url: up.data.url };
      } else {
        payload = { kind: 'text', text: text.trim() };
      }
      await statusService.create(payload);
      setText('');
      setFile(null);
      await feed.reload();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await statusService.remove(id);
      feed.setData((list) => (list || []).filter((p) => p.id !== id));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Status" subtitle="Share a quick update. Posts disappear after 24 hours." icon={CircleDot} />

      <form onSubmit={post} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
        <label htmlFor="status-text" className="sr-only">Status text</label>
        <textarea id="status-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={TEXT_MAX}
          placeholder="What's on your mind?" className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60" />
        {file ? <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-xs text-gray-300"><span className="truncate">{file.name}</span><button type="button" onClick={() => setFile(null)} className="shrink-0 text-red-400">Remove</button></div> : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" className="hidden" aria-label="Attach media"
              onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200"><ImagePlus size={16} />Attach</button>
            <span className="text-xs text-gray-500">{text.length}/{TEXT_MAX}</span>
          </div>
          <button type="submit" disabled={busy || (!file && !text.trim())} className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Posting…' : 'Post'}</button>
        </div>
        <Notice tone="error" className="mt-3">{err}</Notice>
      </form>

      <div className="mt-6 space-y-3">
        {feed.loading ? <p className="text-sm">Loading status…</p> : feed.error ? <Notice tone="error">{feed.error}</Notice> : (feed.data || []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm">Nothing here yet. Be the first to post.</div>
        ) : (feed.data || []).map((p) => (
          <article key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <header className="flex items-center gap-3">
              <Avatar src={p.author?.avatar_url} name={p.author?.username} size={36} />
              <div className="min-w-0 flex-1">
                {p.author ? <Link to={p.userId === user.id ? '/app/profile' : `/app/u/${p.author.username}`} className="block truncate text-sm font-bold text-gray-100 hover:underline">@{p.author.username}</Link> : null}
                <div className="text-xs text-gray-500">{formatTime(p.created_at)}</div>
              </div>
              {p.userId === user.id ? <button type="button" onClick={() => remove(p.id)} aria-label="Delete post" className="hr-icon-button"><Trash2 size={16} /></button> : null}
            </header>
            {p.text ? <p className="mt-3 whitespace-pre-wrap break-words text-sm !text-gray-200">{p.text}</p> : null}
            <Media post={p} />
          </article>
        ))}
      </div>
    </div>
  );
};

export default Status;
