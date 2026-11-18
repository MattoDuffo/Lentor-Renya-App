import type { Doc } from '../core/useDoc';

export function StatusLine({ doc }: { doc: Doc<unknown> }) {
  if (doc.error) return <p className="status error">{doc.error}</p>;
  if (doc.loading) return <p className="status">Loading…</p>;
  return null;
}
