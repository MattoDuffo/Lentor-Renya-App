import { Link } from 'react-router-dom';
import { modules } from '../modules';
import { useSession } from '../core/session';

export function More() {
  const { settings, update } = useSession();
  return (
    <section>
      <h1>More</h1>
      <ul className="menu">
        {modules.map((m) => (
          <li key={m.id}>
            <Link to={`/${m.id}`}>
              <span>{m.icon}</span> {m.title}
            </Link>
          </li>
        ))}
      </ul>
      <h2>This phone</h2>
      <p className="hint">
        Signed in as {settings.person}
        {settings.mode === 'demo' ? ' (trying it out: notes are saved on this phone only)' : ''}.
      </p>
      <button className="secondary" onClick={() => update(null)}>
        Change person or access key
      </button>
    </section>
  );
}
