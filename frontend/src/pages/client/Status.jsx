/** Status (route: /app/status) — 24-hour stories: text, image, video or audio, with views and followers-only posts. */
import { useEffect, useRef, useState } from 'react';
import { CircleDot, Eye, ImagePlus, Lock, Trash2 } from 'lucide-react';
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

const TABS = [{ key: 'all', label: 'Everyone' }, { key: 'following', label: 'Following' }];

/** One story. Marks itself as seen once at least half of it has been on screen. */
const Story = ({ post, mine, onRemove }) => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(!!post.viewed);
  const [viewCount, setViewCount] = useState(post.viewCount || 0);
  const [viewers, setViewers] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (mine || seen || typeof IntersectionObserver === 'undefined') return undefined;
    const el = ref.current;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setSeen(true);
      statusService.view(post.id).catch(() => setSeen(false));
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [mine, seen, post.id]);

  const toggleViewers = async () => {
    if (open) return setOpen(false);
    setOpen(true);
    try {
      const res = await statusService.viewers(post.id);
      setViewers(res.data);
      setViewCount(res.data.length);
    } catch { setViewers([]); }
  };

  return (
    <article ref={ref} className={`rounded-2xl border bg-white/[0.03] p-4 ${!mine && !seen ? 'border-red-400/50' : 'border-white/10'}`}>
      <header className="flex items-center gap-3">
        <Avatar src={post.author?.avatar_url} name={post.author?.username} size={36} />
        <div className="min-w-0 flex-1">
          {post.author ? <Link to={mine ? '/app/profile' : `/app/u/${post.author.username}`} className="block truncate text-sm font-bold text-gray-100 hover:underline">@{post.author.username}</Link> : null}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {formatTime(post.created_at)}
            {post.visibility === 'followers' ? <span className="inline-flex items-center gap-1" title="Only followers can see this"><Lock size={11} />followers</span> : null}
          </div>
        </div>
        {mine ? <button type="button" onClick={() => onRemove(post.id)} aria-label="Delete post" className="hr-icon-button"><Trash2 size={16} /></button> : null}
      </header>
      {post.text ? <p className="mt-3 whitespace-pre-wrap break-words text-sm !text-gray-200">{post.text}</p> : null}
      <Media post={post} />

      {mine ? (
        <div className="mt-3">
          <button type="button" onClick={toggleViewers} aria-expanded={open} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
            <Eye size={14} />{open ? viewCount : post.viewCount} {(open ? viewCount : post.viewCount) === 1 ? 'view' : 'views'}
          </button>
          {open ? (
            <ul className="mt-2 space-y-1.5">
              {viewers === null ? <li className="text-xs">Loading…</li> : viewers.length === 0 ? <li className="text-xs">No views yet.</li> : viewers.map((v) => (
                <li key={v.username} className="flex items-center gap-2 text-xs text-gray-300">
                  <Avatar src={v.avatar_url} name={v.username} size={20} />
                  <Link to={`/app/u/${v.username}`} className="hover:underline">@{v.username}</Link>
                  <span className="ml-auto text-gray-500">{formatTime(v.viewed_at)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

const Status = () => {
  const { user } = useAuth();
  const [scope, setScope] = useState('all');
  const feed = useLoad(async () => (await statusService.list(scope)).data, [scope]);
  const fileRef = useRef(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [followersOnly, setFollowersOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const post = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const visibility = followersOnly ? 'followers' : 'public';
      let payload;
      if (file) {
        const up = await uploadService.upload(file);
        payload = { kind: up.data.kind, text: text.trim() || undefined, media_url: up.data.url, visibility };
      } else {
        payload = { kind: 'text', text: text.trim(), visibility };
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
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" className="hidden" aria-label="Attach media"
              onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200"><ImagePlus size={16} />Attach</button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-300">
              <input type="checkbox" checked={followersOnly} onChange={(e) => setFollowersOnly(e.target.checked)} className="accent-red-500" />
              <Lock size={14} />Followers only
            </label>
            <span className="text-xs text-gray-500">{text.length}/{TEXT_MAX}</span>
          </div>
          <button type="submit" disabled={busy || (!file && !text.trim())} className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Posting…' : 'Post'}</button>
        </div>
        <Notice tone="error" className="mt-3">{err}</Notice>
      </form>

      <div className="mt-6 flex gap-2" role="tablist" aria-label="Status feed">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={scope === t.key} onClick={() => setScope(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm ${scope === t.key ? 'border-red-400/60 bg-white/[0.08] text-white' : 'border-white/10 text-gray-400'}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {feed.loading ? <p className="text-sm">Loading status…</p> : feed.error ? <Notice tone="error">{feed.error}</Notice> : (feed.data || []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm">
            {scope === 'following' ? 'No stories from people you follow. Follow someone from their profile.' : 'Nothing here yet. Be the first to post.'}
          </div>
        ) : (feed.data || []).map((p) => (
          <Story key={p.id} post={p} mine={p.userId === user.id} onRemove={remove} />
        ))}
      </div>
    </div>
  );
};

export default Status;
