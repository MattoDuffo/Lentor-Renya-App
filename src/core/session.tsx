import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Person } from './people';
import { GitHubStore, type GitHubConfig } from './data/githubStore';
import { LocalStore } from './data/localStore';
import type { DataStore } from './data/store';

/** Everything this phone remembers about itself. Never leaves the device. */
export type Settings =
  | { mode: 'github'; person: Person; github: GitHubConfig }
  | { mode: 'demo'; person: Person };

const KEY = 'lentor.settings';

function loadSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Settings) : null;
  } catch {
    return null;
  }
}

interface SessionValue {
  settings: Settings;
  person: Person;
  store: DataStore;
  update(next: Settings | null): void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function makeStore(settings: Settings): DataStore {
  return settings.mode === 'github' ? new GitHubStore(settings.github) : new LocalStore();
}

export function SessionProvider({ children, fallback }: { children: ReactNode; fallback: (save: (s: Settings) => void) => ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(loadSettings);

  const update = (next: Settings | null) => {
    try {
      if (next) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable: settings last for this visit only */
    }
    setSettings(next);
  };

  const value = useMemo<SessionValue | null>(
    () => (settings ? { settings, person: settings.person, store: makeStore(settings), update } : null),
    [settings],
  );

  if (!value) return <>{fallback(update)}</>;
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
