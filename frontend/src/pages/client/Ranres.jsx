/** Ranres (route: /app/ranres) — curated resource links, grouped by category. */
import { useMemo, useState } from 'react';
import { ExternalLink, Library } from 'lucide-react';
import { resourceService } from '../../services/api.js';
import useLoad from '../../hooks/useLoad.js';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const Ranres = () => {
  const { data, loading, error } = useLoad(async () => (await resourceService.list()).data, []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  const cats = useMemo(() => ['All', ...new Set((data || []).map((r) => r.category))], [data]);
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = {};
    (data || []).forEach((r) => {
      if (cat !== 'All' && r.category !== cat) return;
      if (term && !`${r.title} ${r.description || ''}`.toLowerCase().includes(term)) return;
      (out[r.category] ||= []).push(r);
    });
    return out;
  }, [data, q, cat]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ranres" subtitle="Hand-picked resources for learning and building." icon={Library} />
      {loading ? <p className="text-sm">Loading resources…</p> : error ? <Notice tone="error">{error}</Notice> : (
        <>
          <label htmlFor="rr-q" className="sr-only">Filter resources</label>
          <input id="rr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter resources…" className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60" />
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {cats.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${cat === c ? 'border-red-400/60 bg-red-500/20 text-white' : 'border-white/10 text-gray-300'}`}>{c}</button>
            ))}
          </div>
          {Object.keys(groups).length === 0 ? <p className="mt-6 text-sm">No resources match.</p> : Object.entries(groups).map(([name, list]) => (
            <section key={name} className="mt-6">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide !text-gray-400">{name}</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {list.map((r) => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="block h-full rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.07]">
                      <strong className="flex items-center justify-between gap-2 text-sm text-gray-100"><span className="truncate">{r.title}</span><ExternalLink size={14} className="shrink-0 text-gray-500" /></strong>
                      {r.description ? <p className="mt-1 text-xs">{r.description}</p> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
};

export default Ranres;
