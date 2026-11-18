import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHeader({ title, back, action, lede }: { title: string; back?: string; action?: ReactNode; lede?: string }) {
  return (
    <header className="page-header">
      {back && (
        <Link to={back} className="back">
          ‹ Back
        </Link>
      )}
      <div className="title-row">
        <h1>{title}</h1>
        {action}
      </div>
      {lede && <p className="lede">{lede}</p>}
    </header>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function confirmDelete(what: string): boolean {
  return window.confirm(`Delete ${what}? This can't be undone.`);
}
