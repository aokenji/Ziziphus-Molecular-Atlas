import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { compounds } from '../lib/atlas';
import { Icon, type IconName } from './ui';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Atlas', icon: 'atlas' },
  { to: '/species', label: 'Species', icon: 'species' },
  { to: '/about', label: 'About', icon: 'about' },
];

export function AppShell() {
  const { pathname } = useLocation();

  // Native apps land you at the top of a pushed screen; the browser would otherwise
  // keep the previous scroll offset.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="shell">
      <header className="topbar no-select">
        <div className="wrap topbar__inner">
          <Link to="/" className="wordmark" aria-label="Ziziphus Molecular Atlas, home">
            <svg viewBox="0 0 24 24" className="wordmark__mark" aria-hidden="true" focusable="false">
              <line x1="12" y1="6" x2="6.5" y2="16" />
              <line x1="12" y1="6" x2="17.5" y2="16" />
              <line x1="6.5" y1="16" x2="17.5" y2="16" />
              <circle cx="12" cy="6" r="2.6" />
              <circle cx="6.5" cy="16" r="2.6" />
              <circle cx="17.5" cy="16" r="2.6" />
            </svg>
            <span>
              Ziziphus<span className="wordmark__dim"> Atlas</span>
            </span>
          </Link>
          <span className="micro">{compounds.length} compounds</span>
        </div>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>

      <nav className="tabbar no-select" aria-label="Primary">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="tab">
            <Icon name={tab.icon} size={21} />
            <span className="tab__label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
