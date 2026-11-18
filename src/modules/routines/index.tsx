import { useEffect, useState, type FormEvent } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { defineModule } from '../../core/module';
import { newId, useDoc } from '../../core/useDoc';
import { isoDate, WEEKDAYS } from '../../core/dates';
import { Empty, PageHeader, confirmDelete } from '../../ui/Page';
import { StatusLine } from '../../ui/StatusLine';

type Repeat = { kind: 'daily' } | { kind: 'weekly'; days: number[] } | { kind: 'monthly'; day: number };
type TimeOfDay = '' | 'morning' | 'afternoon' | 'evening';

interface Routine {
  id: string;
  title: string;
  notes?: string;
  repeat: Repeat;
  time: TimeOfDay;
}

interface RoutinesFile {
  routines: Routine[];
}

const PATH = 'routines.json';
const EMPTY: RoutinesFile = { routines: [] };
const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: '', label: 'Any time' },
];

function isDue(r: Routine, d: Date): boolean {
  switch (r.repeat.kind) {
    case 'daily':
      return true;
    case 'weekly':
      return r.repeat.days.includes(d.getDay());
    case 'monthly': {
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === Math.min(r.repeat.day, last);
    }
  }
}

function describe(repeat: Repeat): string {
  switch (repeat.kind) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return repeat.days.length === 0 ? 'Weekly' : `Every ${[...repeat.days].sort().map((d) => WEEKDAYS[d]).join(', ')}`;
    case 'monthly':
      return `Monthly, on the ${ordinal(repeat.day)}`;
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Ticks are a personal memory aid: kept on this phone only, never shared,
 * and cleared when the day changes. No history is kept.
 */
const TICKS = 'lentor.routine-ticks';
const TICKS_EVENT = 'lentor:ticks';

function useTicks(): [Set<string>, (id: string) => void] {
  const read = (): Set<string> => {
    try {
      const raw = JSON.parse(localStorage.getItem(TICKS) ?? 'null');
      return raw?.date === isoDate() ? new Set<string>(raw.done) : new Set();
    } catch {
      return new Set();
    }
  };
  const [ticks, setTicks] = useState(read);
  useEffect(() => {
    const sync = () => setTicks(read());
    window.addEventListener(TICKS_EVENT, sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener(TICKS_EVENT, sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  const toggle = (id: string) => {
    const next = read();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    try {
      localStorage.setItem(TICKS, JSON.stringify({ date: isoDate(), done: [...next] }));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(TICKS_EVENT));
  };
  return [ticks, toggle];
}

function TodayChecklist({ routines }: { routines: Routine[] }) {
  const [ticks, toggle] = useTicks();
  const due = routines.filter((r) => isDue(r, new Date()));
  if (due.length === 0) return <Empty>Nothing on the list today.</Empty>;
  return (
    <>
      {TIMES.map(({ value, label }) => {
        const list = due.filter((r) => r.time === value);
        if (list.length === 0) return null;
        return (
          <div key={value || 'any'}>
            <h3>{label}</h3>
            <ul className="checklist">
              {list.map((r) => (
                <li key={r.id}>
                  <label className={ticks.has(r.id) ? 'done' : ''}>
                    <input type="checkbox" checked={ticks.has(r.id)} onChange={() => toggle(r.id)} />
                    <span>
                      {r.title}
                      {r.notes && <small>{r.notes}</small>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function RoutinesHome() {
  const doc = useDoc<RoutinesFile>(PATH, EMPTY);
  const groups: [string, Routine[]][] = [
    ['Daily', doc.data.routines.filter((r) => r.repeat.kind === 'daily')],
    ['Weekly', doc.data.routines.filter((r) => r.repeat.kind === 'weekly')],
    ['Monthly', doc.data.routines.filter((r) => r.repeat.kind === 'monthly')],
  ];
  return (
    <section>
      <PageHeader
        title="Routines"
        lede="The regular rhythm of the house, as a handy reminder."
        action={
          <Link className="pill" to="new">
            + Add
          </Link>
        }
      />
      <StatusLine doc={doc} />
      <h2>Today</h2>
      <TodayChecklist routines={doc.data.routines} />
      <p className="hint">Ticks are just for you: they stay on this phone and clear each day.</p>
      {groups.map(([label, list]) =>
        list.length === 0 ? null : (
          <div key={label}>
            <h2>{label}</h2>
            <ul className="menu">
              {list.map((r) => (
                <li key={r.id}>
                  <Link to={r.id}>
                    <span>
                      {r.title}
                      <small>{describe(r.repeat)}{r.time ? ` · ${r.time}` : ''}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </section>
  );
}

function RoutineEditor() {
  const { id } = useParams();
  const doc = useDoc<RoutinesFile>(PATH, EMPTY);
  const existing = doc.data.routines.find((r) => r.id === id);
  if (id && !existing) {
    return (
      <section>
        <PageHeader title="Routine" back="/routines" />
        {doc.loading ? <StatusLine doc={doc} /> : <Empty>This routine was removed.</Empty>}
      </section>
    );
  }
  return <RoutineForm key={existing?.id ?? 'new'} existing={existing} />;
}

function RoutineForm({ existing }: { existing?: Routine }) {
  const navigate = useNavigate();
  const doc = useDoc<RoutinesFile>(PATH, EMPTY);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [kind, setKind] = useState<Repeat['kind']>(existing?.repeat.kind ?? 'weekly');
  const [days, setDays] = useState<number[]>(existing?.repeat.kind === 'weekly' ? existing.repeat.days : [new Date().getDay()]);
  const [monthDay, setMonthDay] = useState(existing?.repeat.kind === 'monthly' ? existing.repeat.day : 1);
  const [time, setTime] = useState<TimeOfDay>(existing?.time ?? '');

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const repeat: Repeat = kind === 'daily' ? { kind } : kind === 'weekly' ? { kind, days: [...days].sort() } : { kind, day: monthDay };
    const routine: Routine = { id: existing?.id ?? newId(), title: title.trim(), notes: notes.trim() || undefined, repeat, time };
    try {
      await doc.update((f) => ({ routines: [...f.routines.filter((r) => r.id !== routine.id), routine] }), `${existing ? 'Update' : 'Add'} routine: ${routine.title}`);
      navigate('/routines', { replace: true });
    } catch {
      /* shown by StatusLine */
    }
  };

  const remove = async () => {
    if (!existing || !confirmDelete(`"${existing.title}"`)) return;
    try {
      await doc.update((f) => ({ routines: f.routines.filter((r) => r.id !== existing.id) }), `Remove routine: ${existing.title}`);
      navigate('/routines', { replace: true });
    } catch {
      /* shown by StatusLine */
    }
  };

  return (
    <section>
      <PageHeader title={existing ? 'Edit routine' : 'New routine'} back="/routines" />
      <form className="form" onSubmit={save}>
        <label>
          What
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Change bedsheets" />
        </label>
        <label>
          Notes (optional)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Spare sets are in the hall cupboard" />
        </label>
        <label>How often</label>
        <div className="segmented">
          {(['daily', 'weekly', 'monthly'] as const).map((k) => (
            <button type="button" key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
        {kind === 'weekly' && (
          <div className="segmented days">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button
                type="button"
                key={d}
                className={days.includes(d) ? 'on' : ''}
                onClick={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
              >
                {WEEKDAYS[d]}
              </button>
            ))}
          </div>
        )}
        {kind === 'monthly' && (
          <label>
            Day of the month
            <input type="number" min={1} max={31} value={monthDay} onChange={(e) => setMonthDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))} />
          </label>
        )}
        <label>Time of day</label>
        <div className="segmented">
          {TIMES.map((t) => (
            <button type="button" key={t.label} className={time === t.value ? 'on' : ''} onClick={() => setTime(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        <StatusLine doc={doc} />
        <button className="primary" disabled={doc.saving || !title.trim() || (kind === 'weekly' && days.length === 0)}>
          {doc.saving ? 'Saving…' : 'Save'}
        </button>
        {existing && (
          <button type="button" className="link danger" onClick={remove}>
            Delete this routine
          </button>
        )}
      </form>
    </section>
  );
}

function RoutinesPage() {
  return (
    <Routes>
      <Route index element={<RoutinesHome />} />
      <Route path="new" element={<RoutineEditor />} />
      <Route path=":id" element={<RoutineEditor />} />
    </Routes>
  );
}

function RoutinesToday() {
  const doc = useDoc<RoutinesFile>(PATH, EMPTY);
  if (!doc.data.routines.some((r) => isDue(r, new Date()))) return null;
  return <TodayChecklist routines={doc.data.routines} />;
}

export default defineModule({
  id: 'routines',
  title: 'Routines',
  icon: '🔁',
  description: 'Daily, weekly and monthly reminders',
  Page: RoutinesPage,
  TodayCard: RoutinesToday,
  todayOrder: 20,
  search: [
    {
      path: PATH,
      empty: EMPTY,
      items: (f: RoutinesFile) =>
        f.routines.map((r) => ({ title: r.title, snippet: describe(r.repeat), text: r.notes, to: `/routines/${r.id}` })),
    },
  ],
});
