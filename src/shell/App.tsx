import { useEffect } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { modules } from '../modules';
import { SessionProvider } from '../core/session';
import { Setup } from './Setup';
import { Today } from './Today';
import { More } from './More';
import { Search } from './Search';

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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <SessionProvider fallback={(save) => <Setup onDone={save} />}>
      <HashRouter>
        <ScrollToTop />
        <main className="page">
          <Routes>
            <Route path="/" element={<Today />} />
            {modules.map(({ id, Page }) => (
              <Route key={id} path={`/${id}/*`} element={<Page />} />
            ))}
            <Route path="/more" element={<More />} />
            <Route path="/search" element={<Search />} />
            <Route path="*" element={<Today />} />
          </Routes>
        </main>
        <TabBar />
      </HashRouter>
    </SessionProvider>
  );
}
