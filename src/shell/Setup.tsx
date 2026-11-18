import { useState, type FormEvent } from 'react';
import { PEOPLE, type Person } from '../core/people';
import { GitHubStore } from '../core/data/githubStore';
import type { Settings } from '../core/session';

const DEFAULT_REPO = { owner: 'MattoDuffo', repo: 'Lentor-Renya-App', branch: 'household-data' };

/** First-run screen: who uses this phone, and the access key for the household data. */
export function Setup({ onDone }: { onDone: (s: Settings) => void }) {
  const [person, setPerson] = useState<Person | null>(null);
  const [token, setToken] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (e: FormEvent) => {
    e.preventDefault();
    if (!person) return;
    const github = { ...repo, token: token.trim() };
    setChecking(true);
    setError(null);
    try {
      await new GitHubStore(github).verify();
      onDone({ mode: 'github', person, github });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="setup">
      <img className="hero" src={`${import.meta.env.BASE_URL}logo.jpg`} alt="A happy red panda by the pool at the Lentor Beach Club" />
      <h1 className="greeting">Welcome!</h1>
      <p className="lede">Kampung Lentor: a shared place for the day ahead and the little things worth knowing.</p>

      <h2>Who is using this phone?</h2>
      <div className="people">
        {PEOPLE.map((p) => (
          <button key={p} type="button" className={p === person ? 'chip selected' : 'chip'} onClick={() => setPerson(p)}>
            {p}
          </button>
        ))}
      </div>

      {person && (
        <form onSubmit={connect}>
          <h2>Access key</h2>
          <p className="hint">Paste the key Mat set up for this phone. It stays on this phone only.</p>
          <input
            type="password"
            autoComplete="off"
            placeholder="github_pat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="button" className="link" onClick={() => setAdvanced(!advanced)}>
            {advanced ? 'Hide' : 'Show'} repository settings
          </button>
          {advanced && (
            <div className="advanced">
              {(['owner', 'repo', 'branch'] as const).map((k) => (
                <label key={k}>
                  {k}
                  <input value={repo[k]} onChange={(e) => setRepo({ ...repo, [k]: e.target.value })} />
                </label>
              ))}
            </div>
          )}
          {error && <p className="status error">{error}</p>}
          <button className="primary" disabled={checking || !token.trim()}>
            {checking ? 'Checking…' : 'Connect'}
          </button>
          <button type="button" className="link" onClick={() => onDone({ mode: 'demo', person })}>
            Just try it out (saved on this phone only)
          </button>
        </form>
      )}
    </main>
  );
}
