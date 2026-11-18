import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from './session';
import { ConflictError } from './data/store';

const REFRESH_MS = 45_000;
const CACHE = 'lentor.cache:';

interface Cached<T> {
  data: T;
  version: string | null;
}

function readCache<T>(path: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(CACHE + path);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(path: string, value: Cached<T>) {
  try {
    localStorage.setItem(CACHE + path, JSON.stringify(value));
  } catch {
    /* cache is a convenience only */
  }
}

export interface Doc<T> {
  data: T;
  loading: boolean;
  error: string | null;
  saving: boolean;
  /** Apply a change. If someone else saved first, their version is reloaded and the change re-applied. */
  update(change: (current: T) => T, message: string): Promise<void>;
  refresh(): void;
}

/**
 * A shared JSON file. Shows the last-known copy straight away (works offline),
 * refreshes when opened, while visible, and when the app comes back to the foreground.
 */
export function useDoc<T>(path: string, empty: T): Doc<T> {
  const { store, person } = useSession();
  const cached = readCache<T>(path);
  const [data, setData] = useState<T>(cached?.data ?? empty);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const version = useRef<string | null>(cached?.version ?? null);
  const emptyRef = useRef(empty);

  const load = useCallback(async () => {
    try {
      const file = await store.read(path);
      const next = file.text ? (JSON.parse(file.text) as T) : emptyRef.current;
      version.current = file.version;
      setData(next);
      writeCache(path, { data: next, version: file.version });
      setError(null);
      return next;
    } catch (e) {
      setError(navigator.onLine ? (e as Error).message : 'Offline: showing the last saved copy.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [store, path]);

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const update = useCallback(
    async (change: (current: T) => T, message: string) => {
      setSaving(true);
      try {
        let base = data;
        for (let attempt = 0; attempt < 4; attempt++) {
          const next = change(base);
          try {
            const v = await store.write(path, JSON.stringify(next, null, 2) + '\n', version.current, `${message} (${person})`);
            version.current = v;
            setData(next);
            writeCache(path, { data: next, version: v });
            setError(null);
            return;
          } catch (e) {
            if (!(e instanceof ConflictError)) throw e;
            const fresh = await load();
            if (fresh === null) throw e;
            base = fresh;
          }
        }
        throw new Error('Could not save after several tries. Please try again.');
      } catch (e) {
        setError((e as Error).message);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [data, store, path, person, load],
  );

  return { data, loading, error, saving, update, refresh: load };
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
