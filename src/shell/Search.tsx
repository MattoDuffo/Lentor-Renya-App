import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { modules } from '../modules';
import { useDoc } from '../core/useDoc';
import type { SearchItem, SearchSource } from '../core/module';
import { PageHeader } from '../ui/Page';

function normalise(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Every word typed must appear somewhere in the item. Title matches rank first. */
function matches(item: SearchItem, words: string[]): number {
  const title = normalise(item.title);
  const all = `${title} ${normalise(item.snippet ?? '')} ${normalise(item.text ?? '')}`;
  if (!words.every((w) => all.includes(w))) return 0;
  return words.every((w) => title.includes(w)) ? 2 : 1;
}

function SourceResults({ source, words, icon, title, onCount }: { source: SearchSource; words: string[]; icon: string; title: string; onCount: (n: number) => void }) {
  const doc = useDoc(source.path, source.empty);
  const results = useMemo(
    () =>
      source
        .items(doc.data)
        .map((item) => ({ item, score: matches(item, words) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20),
    [doc.data, words, source],
  );
  useEffect(() => {
    onCount(results.length);
  }, [results.length, onCount]);
  if (results.length === 0) return null;
  return (
    <div>
      <h2>
        {icon} {title}
      </h2>
      <ul className="menu">
        {results.map(({ item }, i) => (
          <li key={i}>
            <Link to={item.to}>
              <span>
                {item.title}
                {item.snippet && <small>{item.snippet}</small>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const words = useMemo(() => normalise(query).split(/\s+/).filter(Boolean), [query]);
  const sources = modules.flatMap((m) => (m.search ?? []).map((s, i) => ({ key: `${m.id}-${i}`, source: s, icon: m.icon, title: m.title })));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const onCount = useMemo(() => {
    const fns: Record<string, (n: number) => void> = {};
    sources.forEach(({ key }) => (fns[key] = (n) => setCounts((c) => (c[key] === n ? c : { ...c, [key]: n }))));
    return fns;
    // sources are static for the app's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <PageHeader title="Search" />
      <input
        type="search"
        autoFocus
        className="search-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
        }}
        placeholder="Where is…, how do I…, what's for…"
      />
      {words.length === 0 ? (
        <p className="hint">Search the house guide, recipes, routines, shopping list and notes.</p>
      ) : (
        <>
          {sources.map(({ key, source, icon, title }) => (
            <SourceResults key={key} source={source} words={words} icon={icon} title={title} onCount={onCount[key]} />
          ))}
          {total === 0 && <p className="empty">Nothing found for "{query}". Maybe ask, and then add the answer to the house guide?</p>}
        </>
      )}
    </section>
  );
}
