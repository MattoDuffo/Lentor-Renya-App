import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { modules } from '../modules';
import { SessionProvider } from '../core/session';
import { Setup } from './Setup';
import { Today } from './Today';
import { More } from './More';

/** Phones fit about five tabs: Today, the first three modules, then More. */
const TAB_MODULES = 3;

function TabBar() {
  const tabs = [
    { to: '/', icon: '☀️', title: 'Today' },
    ...modules.slice(0, TAB_MODULES).map((m) => ({ to: `/${m.id}`, icon: m.icon, title: m.title })),
    { to: '/more', icon: '☰', title: 'More' },
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}>
          <span aria-hidden>{t.icon}</span>
          {t.title}
        </NavLink>
      ))}
    </nav>
  );
}

export function App() {
  return (
    <SessionProvider fallback={(save) => <Setup onDone={save} />}>
      <HashRouter>
        <main className="page">
          <Routes>
            <Route path="/" element={<Today />} />
            {modules.map(({ id, Page }) => (
              <Route key={id} path={`/${id}/*`} element={<Page />} />
            ))}
            <Route path="/more" element={<More />} />
            <Route path="*" element={<Today />} />
          </Routes>
        </main>
        <TabBar />
      </HashRouter>
    </SessionProvider>
  );
}
