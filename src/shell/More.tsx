import { Link } from 'react-router-dom';
import { modules } from '../modules';
import { useSession } from '../core/session';

export function More() {
  const { settings, update } = useSession();
  return (
    <section>
      <h1>More</h1>
      <ul className="menu">
        <li>
          <Link to="/search">
            <span className="menu-icon">🔍</span>
            <span>
              Search
              <small>Find anything in the app</small>
            </span>
          </Link>
        </li>
        {modules.map((m) => (
          <li key={m.id}>
            <Link to={`/${m.id}`}>
              <span className="menu-icon">{m.icon}</span>
              <span>
                {m.title}
                {m.description && <small>{m.description}</small>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <h2>This phone</h2>
      <p className="hint">
        Signed in as {settings.person}
        {settings.mode === 'demo' ? ' (trying it out: everything is saved on this phone only)' : ''}.
      </p>
      <button className="secondary" onClick={() => update(null)}>
        Change person or access key
      </button>
    </section>
  );
}
