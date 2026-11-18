import { Link } from 'react-router-dom';
import { modules } from '../modules';
import { useSession } from '../core/session';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Today() {
  const { person } = useSession();
  const now = new Date();
  return (
    <section>
      <p className="date">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1>
        {greeting(now.getHours())}, {person}
      </h1>
      {modules
        .filter((m) => m.TodayCard)
        .map(({ id, title, icon, TodayCard }) => (
          <article key={id} className="card">
            <header>
              <h2>
                {icon} {title}
              </h2>
              <Link to={`/${id}`}>Open</Link>
            </header>
            {TodayCard && <TodayCard />}
          </article>
        ))}
    </section>
  );
}
