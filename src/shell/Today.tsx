import { Link, useNavigate } from 'react-router-dom';
import { modules } from '../modules';
import { useSession } from '../core/session';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Today() {
  const { person } = useSession();
  const navigate = useNavigate();
  const now = new Date();
  const cards = modules.filter((m) => m.TodayCard).sort((a, b) => (a.todayOrder ?? 100) - (b.todayOrder ?? 100));
  return (
    <section>
      <img className="hero" src={`${import.meta.env.BASE_URL}logo.jpg`} alt="" />
      <p className="date">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1 className="greeting">
        {greeting(now.getHours())}, {person}
      </h1>
      <button className="search-box" onClick={() => navigate('/search')}>
        🔍 <span>Search anything…</span>
      </button>
      {cards.map(({ id, title, icon, TodayCard }) => (
        <article key={id} className="card">
          <header>
            <h2>
              {icon} {title}
            </h2>
            <Link to={`/${id}`}>Open</Link>
          </header>
          <div className="card-body">{TodayCard && <TodayCard />}</div>
        </article>
      ))}
    </section>
  );
}
