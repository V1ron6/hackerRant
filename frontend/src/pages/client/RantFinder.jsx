/** RantFinder (route: /app/rantfinder) — find people by username or (opt-in) nearby. */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { chatService, discoveryService, getErrorMessage, userService } from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import Avatar from '../../components/Avatar.jsx';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const Person = ({ p, onMessage, busy }) => (
  <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
    <Avatar src={p.avatar_url} name={p.username} size={40} />
    <Link to={`/app/u/${p.username}`} className="min-w-0 flex-1">
      <strong className="block truncate text-sm text-gray-100">@{p.username}</strong>
      <span className="block truncate text-xs text-gray-500">
        {[p.first_name, p.last_name].filter(Boolean).join(' ') || 'View profile'}
        {p.distanceKm ? ` · about ${p.distanceKm} km away` : ''}
      </span>
    </Link>
    <button type="button" disabled={busy} onClick={() => onMessage(p.username)} className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Message</button>
  </li>
);

const RantFinder = () => {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [tab, setTab] = useState('search');
  const [q, setQ] = useState('');
  const dq = useDebounce(q.trim(), 350);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');
  const [nearby, setNearby] = useState(null);
  const [radius, setRadius] = useState(25);
  const [locBusy, setLocBusy] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (dq.length < 2) { setResults([]); setErr(''); return undefined; }
    let alive = true;
    setSearching(true);
    discoveryService.search(dq)
      .then((res) => { if (alive) { setResults(res.data); setErr(''); } })
      .catch((e) => { if (alive) setErr(getErrorMessage(e)); })
      .finally(() => { if (alive) setSearching(false); });
    return () => { alive = false; };
  }, [dq]);

  const message = async (username) => {
    setOpening(true);
    try {
      const res = await chatService.create(username);
      navigate(`/app/chat/${res.data.id}`, { state: { title: `@${username}` } });
    } catch (e) {
      setErr(getErrorMessage(e));
      setOpening(false);
    }
  };

  const findNearby = () => {
    setLocBusy(true);
    setErr('');
    if (!navigator.geolocation) { setErr('Your browser does not support location.'); setLocBusy(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (!settings.share_location) await update({ share_location: true });
          await userService.updateProfile({ latitude: lat, longitude: lng });
          const res = await discoveryService.nearby({ lat, lng, radiusKm: radius });
          setNearby(res.data);
        } catch (e) {
          setErr(getErrorMessage(e));
        } finally {
          setLocBusy(false);
        }
      },
      () => { setErr('Location permission was denied.'); setLocBusy(false); },
      { timeout: 10000 }
    );
  };

  const tabCls = (on) => `flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${on ? 'bg-red-500 text-white' : 'text-gray-300'}`;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="RantFinder" subtitle="Find people to talk to." icon={Search} />
      <div className="mb-4 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'search'} className={tabCls(tab === 'search')} onClick={() => setTab('search')}>By username</button>
        <button type="button" role="tab" aria-selected={tab === 'nearby'} className={tabCls(tab === 'nearby')} onClick={() => setTab('nearby')}>Nearby</button>
      </div>

      <Notice tone="error" className="mb-3">{err}</Notice>

      {tab === 'search' ? (
        <>
          <label htmlFor="rf-q" className="sr-only">Search usernames</label>
          <input id="rf-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Start typing a username…" autoComplete="off"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60" />
          <ul className="mt-4 space-y-2">
            {searching ? <li className="text-sm">Searching…</li> : dq.length >= 2 && results.length === 0 && !err ? <li className="text-sm">No one found for “{dq}”.</li> : null}
            {results.map((p) => <Person key={p.username} p={p} onMessage={message} busy={opening} />)}
          </ul>
          {dq.length < 2 && !q ? <p className="mt-4 text-sm">Type at least 2 characters.</p> : null}
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-start gap-2 text-sm"><MapPin size={16} className="mt-0.5 shrink-0 text-red-400" />
              Finding people nearby is opt-in for everyone. We store only a rough position (about 1 km) and never show it: people only see an approximate distance. Only people who also turned this on can appear, and you can turn it off any time in Settings, which erases your position.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label htmlFor="rf-r" className="text-sm text-gray-300">Within</label>
              <select id="rf-r" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="rounded-lg border px-2 py-2 text-sm">
                {[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
              <button type="button" onClick={findNearby} disabled={locBusy} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {locBusy ? 'Looking…' : settings.share_location ? 'Find people nearby' : 'Turn on and find nearby'}
              </button>
            </div>
          </div>
          {nearby ? (
            <ul className="mt-4 space-y-2">
              {nearby.length === 0 ? <li className="text-sm">No one nearby right now.</li> : null}
              {nearby.map((p) => <Person key={p.username} p={p} onMessage={message} busy={opening} />)}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
};

export default RantFinder;
