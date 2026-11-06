/** Reels (route: /app/reels) — short vertical videos. Scroll-snap feed, autoplay on screen, likes. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Clapperboard, Heart, Lock, Plus, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getErrorMessage, reelService, uploadService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/Avatar.jsx';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const CAPTION_MAX = 150;
const TABS = [{ key: 'all', label: 'For you' }, { key: 'following', label: 'Following' }];

const ReelCard = ({ reel, mine, muted, onToggleMute, onLike, onRemove }) => {
  const ref = useRef(null);

  // Play only the reel that is mostly on screen.
  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.6 });
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative mx-auto h-[calc(100dvh-300px)] min-h-[360px] w-full max-w-sm snap-start overflow-hidden rounded-2xl border border-white/10 bg-black">
      <video ref={ref} src={reel.video_url} loop playsInline muted={muted} preload="metadata"
        onClick={onToggleMute} className="h-full w-full object-contain" />
      <button type="button" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="absolute left-3 top-3 rounded-full bg-black/50 p-2 text-white">
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
        <button type="button" onClick={() => onLike(reel)} aria-pressed={reel.liked} aria-label={reel.liked ? 'Unlike' : 'Like'} className="flex flex-col items-center text-white">
          <span className="rounded-full bg-black/50 p-2.5"><Heart size={22} className={reel.liked ? 'fill-red-500 text-red-500' : ''} /></span>
          <span className="mt-0.5 text-xs">{reel.likeCount}</span>
        </button>
        {mine ? (
          <button type="button" onClick={() => onRemove(reel.id)} aria-label="Delete reel" className="rounded-full bg-black/50 p-2.5 text-white"><Trash2 size={18} /></button>
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pr-16">
        <Link to={mine ? '/app/profile' : `/app/u/${reel.author?.username}`} className="flex items-center gap-2 text-sm font-bold text-white hover:underline">
          <Avatar src={reel.author?.avatar_url} name={reel.author?.username} size={28} />
          @{reel.author?.username}
          {reel.visibility === 'followers' ? <Lock size={12} className="opacity-70" /> : null}
        </Link>
        {reel.caption ? <p className="mt-1.5 break-words text-sm !text-gray-100">{reel.caption}</p> : null}
      </div>
    </section>
  );
};

const Reels = () => {
  const { user } = useAuth();
  const [scope, setScope] = useState('all');
  const [reels, setReels] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState('');
  const [muted, setMuted] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [followersOnly, setFollowersOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async (sc) => {
    setLoading(true);
    setErr('');
    try {
      const res = await reelService.feed({ scope: sc });
      setReels(res.data.reels);
      setCursor(res.data.nextCursor);
    } catch (e) { setErr(getErrorMessage(e)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(scope); }, [scope, load]);

  const loadMore = async () => {
    if (!cursor || more) return;
    setMore(true);
    try {
      const res = await reelService.feed({ scope, cursor });
      setReels((prev) => [...prev, ...res.data.reels.filter((r) => !prev.some((p) => p.id === r.id))]);
      setCursor(res.data.nextCursor);
    } catch (e) { setErr(getErrorMessage(e)); } finally { setMore(false); }
  };

  const like = async (reel) => {
    // optimistic, rolled back if the request fails
    const flip = (liked, count) => setReels((rs) => rs.map((r) => (r.id === reel.id ? { ...r, liked, likeCount: count } : r)));
    flip(!reel.liked, reel.likeCount + (reel.liked ? -1 : 1));
    try {
      const res = await (reel.liked ? reelService.unlike(reel.id) : reelService.like(reel.id));
      flip(res.data.liked, res.data.likeCount);
    } catch (e) { flip(reel.liked, reel.likeCount); setErr(getErrorMessage(e)); }
  };

  const remove = async (id) => {
    try {
      await reelService.remove(id);
      setReels((rs) => rs.filter((r) => r.id !== id));
    } catch (e) { setErr(getErrorMessage(e)); }
  };

  const publish = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      if (!file.type.startsWith('video/')) throw new Error('Choose a video file (mp4 or webm).');
      const up = await uploadService.upload(file);
      if (up.data.kind !== 'video') throw new Error('That file is not a video.');
      await reelService.create({ video_url: up.data.url, caption: caption.trim() || undefined, visibility: followersOnly ? 'followers' : 'public' });
      setFile(null); setCaption(''); setShowForm(false);
      await load(scope);
    } catch (error) { setErr(getErrorMessage(error)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Reels" subtitle="Short videos from people on hackerRant." icon={Clapperboard} />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-2" role="tablist" aria-label="Reels feed">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={scope === t.key} onClick={() => setScope(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm ${scope === t.key ? 'border-red-400/60 bg-white/[0.08] text-white' : 'border-white/10 text-gray-400'}`}>{t.label}</button>
          ))}
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} />New reel</button>
      </div>

      {showForm ? (
        <form onSubmit={publish} className="mb-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <input ref={fileRef} type="file" accept="video/mp4,video/webm" className="hidden" aria-label="Choose video"
            onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200">{file ? 'Change video' : 'Choose video'}</button>
            <span className="truncate text-xs text-gray-400">{file ? file.name : 'mp4 or webm, up to 25 MB'}</span>
          </div>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={CAPTION_MAX} placeholder="Caption (optional)" aria-label="Caption"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-300">
              <input type="checkbox" checked={followersOnly} onChange={(e) => setFollowersOnly(e.target.checked)} className="accent-red-500" />
              <Lock size={14} />Followers only
            </label>
            <button type="submit" disabled={busy || !file} className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Posting…' : 'Post reel'}</button>
          </div>
        </form>
      ) : null}

      <Notice tone="error" className="mb-3">{err}</Notice>

      {loading ? <p className="text-sm">Loading reels…</p> : reels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm">
          {scope === 'following' ? 'No reels from people you follow yet.' : 'No reels yet. Post the first one.'}
        </div>
      ) : (
        <div className="max-h-[calc(100dvh-300px)] snap-y snap-mandatory space-y-4 overflow-y-auto pr-1">
          {reels.map((r) => (
            <ReelCard key={r.id} reel={r} mine={r.userId === user.id} muted={muted}
              onToggleMute={() => setMuted((m) => !m)} onLike={like} onRemove={remove} />
          ))}
          {cursor ? (
            <div className="snap-start py-2 text-center">
              <button type="button" onClick={loadMore} disabled={more} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-200 disabled:opacity-60">{more ? 'Loading…' : 'Load more'}</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Reels;
