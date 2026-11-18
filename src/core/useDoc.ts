import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from './session';
import { ConflictError } from './data/store';

const REFRESH_MS = 45_000;
const CACHE = 'lentor.cache:';
const CHANGED = 'lentor:doc-changed';

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
  // Let other screens showing the same file pick up the change.
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: path }));
}

/** Saves to the same file run one after another, never in parallel. */
const queues = new Map<string, Promise<unknown>>();
function enqueue<R>(path: string, job: () => Promise<R>): Promise<R> {
  const run = (queues.get(path) ?? Promise.resolve()).catch(() => {}).then(job);
  queues.set(path, run);
  return run;
}

export interface Doc<T> {
  data: T;
  loading: boolean;
  error: string | null;
  saving: boolean;
  /**
   * Apply a change. The screen updates immediately; if someone else saved in
   * the meantime, their version is loaded and the change re-applied on top.
   */
  update(change: (current: T) => T, message: string): Promise<void>;
  refresh(): void;
}

/**
 * A shared JSON file. Shows the last-known copy straight away (works offline),
 * refreshes when opened, while visible, and when the app returns to the foreground.
 */
export function useDoc<T>(path: string, empty: T): Doc<T> {
  const { store, person } = useSession();
  const cached = readCache<T>(path);
  const [data, setDataState] = useState<T>(cached?.data ?? empty);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dataRef = useRef<T>(data);
  const version = useRef<string | null>(cached?.version ?? null);
  const pending = useRef(0);
  const emptyRef = useRef(empty);

  const setData = (next: T) => {
    dataRef.current = next;
    setDataState(next);
  };

  const load = useCallback(async (): Promise<T | null> => {
    try {
      const file = await store.read(path);
      const next = file.text ? (JSON.parse(file.text) as T) : emptyRef.current;
      version.current = file.version;
      // Don't overwrite an optimistic change that is still being saved.
      if (pending.current === 0) setData(next);
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
    const onChanged = (e: Event) => {
      if ((e as CustomEvent).detail !== path || pending.current > 0) return;
      const c = readCache<T>(path);
      if (c) {
        version.current = c.version;
        setData(c.data);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(CHANGED, onChanged);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(CHANGED, onChanged);
    };
  }, [load, path]);

  const update = useCallback(
    (change: (current: T) => T, message: string) => {
      pending.current++;
      setSaving(true);
      setData(change(dataRef.current)); // optimistic
      return enqueue(path, async () => {
        try {
          let base = readCache<T>(path)?.data ?? dataRef.current;
          let baseVersion = readCache<T>(path)?.version ?? version.current;
          for (let attempt = 0; attempt < 4; attempt++) {
            const next = change(base);
            try {
              const v = await store.write(path, JSON.stringify(next, null, 2) + '\n', baseVersion, `${message} (${person})`);
              version.current = v;
              writeCache(path, { data: next, version: v });
              setError(null);
              return;
            } catch (e) {
              if (!(e instanceof ConflictError)) throw e;
              const file = await store.read(path);
              base = file.text ? (JSON.parse(file.text) as T) : emptyRef.current;
              baseVersion = file.version;
            }
          }
          throw new Error('Could not save after several tries. Please try again.');
        } catch (e) {
          setError((e as Error).message);
          throw e;
        } finally {
          pending.current--;
          if (pending.current === 0) {
            setSaving(false);
            const c = readCache<T>(path);
            if (c) setData(c.data); // settle on what was actually saved
          }
        }
      });
    },
    [store, path, person],
  );

  return { data, loading, error, saving, update, refresh: load };
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
