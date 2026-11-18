import { useState, type FormEvent } from 'react';
import { defineModule } from '../../core/module';
import { newId, useDoc } from '../../core/useDoc';
import { useSession } from '../../core/session';
import { StatusLine } from '../../ui/StatusLine';

interface Note {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface NotesFile {
  notes: Note[];
}

const PATH = 'notes.json';
const EMPTY: NotesFile = { notes: [] };

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function NoteItem({ note, onRemove }: { note: Note; onRemove?: () => void }) {
  return (
    <li className="note">
      <p>{note.text}</p>
      <div className="note-meta">
        <span>
          {note.author} · {when(note.createdAt)}
        </span>
        {onRemove && (
          <button className="link" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </li>
  );
}

function NotesPage() {
  const { person } = useSession();
  const doc = useDoc<NotesFile>(PATH, EMPTY);
  const [text, setText] = useState('');

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const note: Note = { id: newId(), author: person, text: value, createdAt: new Date().toISOString() };
    try {
      await doc.update((f) => ({ notes: [note, ...f.notes] }), 'Add note');
      setText('');
    } catch {
      /* error is shown by StatusLine; the text stays so nothing is lost */
    }
  };

  const remove = (id: string) => doc.update((f) => ({ notes: f.notes.filter((n) => n.id !== id) }), 'Remove note').catch(() => {});

  return (
    <section>
      <h1>Notes</h1>
      <p className="lede">Anything worth sharing: plans, reminders, a thank-you.</p>
      <form className="composer" onSubmit={add}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note…" rows={3} />
        <button className="primary" disabled={doc.saving || !text.trim()}>
          {doc.saving ? 'Saving…' : 'Post'}
        </button>
      </form>
      <StatusLine doc={doc} />
      {doc.data.notes.length === 0 && !doc.loading ? (
        <p className="empty">No notes yet.</p>
      ) : (
        <ul className="notes">
          {doc.data.notes.map((n) => (
            <NoteItem key={n.id} note={n} onRemove={() => remove(n.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function NotesToday() {
  const doc = useDoc<NotesFile>(PATH, EMPTY);
  const latest = doc.data.notes.slice(0, 3);
  if (latest.length === 0) return null;
  return (
    <ul className="notes compact">
      {latest.map((n) => (
        <NoteItem key={n.id} note={n} />
      ))}
    </ul>
  );
}

export default defineModule({
  id: 'notes',
  title: 'Notes',
  icon: '📝',
  description: 'Shared notes for everyone',
  Page: NotesPage,
  TodayCard: NotesToday,
  todayOrder: 40,
  search: [
    {
      path: PATH,
      empty: EMPTY,
      items: (f: NotesFile) => f.notes.map((n) => ({ title: n.text.split('\n')[0].slice(0, 80), snippet: `Note from ${n.author}`, text: n.text, to: '/notes' })),
    },
  ],
});
