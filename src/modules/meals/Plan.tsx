import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDoc, newId } from '../../core/useDoc';
import { useSession } from '../../core/session';
import { addDays, dayLabel, isoDate, startOfWeek, fromIso } from '../../core/dates';
import { StatusLine } from '../../ui/StatusLine';
import { Empty } from '../../ui/Page';
import { EMPTY_MEALS, EMPTY_RECIPES, MEALS, RECIPES, SLOTS, findRecipe, prune, type MealsFile, type RecipesFile, type Slot, type MealEntry } from './data';

function RecipeOptions({ id }: { id: string }) {
  const recipes = useDoc<RecipesFile>(RECIPES, EMPTY_RECIPES);
  return (
    <datalist id={id}>
      {recipes.data.recipes.map((r) => (
        <option key={r.id} value={r.title} />
      ))}
    </datalist>
  );
}

export function MealText({ entry }: { entry: MealEntry }) {
  return entry.recipeId ? <Link to={`/meals/recipes/${entry.recipeId}`}>{entry.text}</Link> : <span>{entry.text}</span>;
}

function SlotEditor({ date, slot, done }: { date: string; slot: Slot; done: () => void }) {
  const { person } = useSession();
  const meals = useDoc<MealsFile>(MEALS, EMPTY_MEALS);
  const recipes = useDoc<RecipesFile>(RECIPES, EMPTY_RECIPES);
  const current = meals.data.plan[date]?.[slot];
  const [text, setText] = useState(current?.text ?? '');

  const set = (entry: MealEntry | undefined) => {
    meals
      .update((f) => {
        const day = { ...(f.plan[date] ?? {}) };
        if (entry) day[slot] = entry;
        else delete day[slot];
        return prune({ ...f, plan: { ...f.plan, [date]: day } });
      }, `Meal plan: ${date} ${slot}`)
      .catch(() => {});
    done();
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return set(undefined);
    set({ text: value, recipeId: findRecipe(recipes.data.recipes, value)?.id, by: person });
  };

  return (
    <form className="inline-form" onSubmit={save}>
      <input autoFocus list="plan-recipes" value={text} onChange={(e) => setText(e.target.value)} placeholder="Dish or recipe" />
      <RecipeOptions id="plan-recipes" />
      <div className="row">
        <button className="pill">Save</button>
        {current && (
          <button type="button" className="pill ghost" onClick={() => set(undefined)}>
            Clear
          </button>
        )}
        <button type="button" className="pill ghost" onClick={done}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Ideas() {
  const { person } = useSession();
  const meals = useDoc<MealsFile>(MEALS, EMPTY_MEALS);
  const recipes = useDoc<RecipesFile>(RECIPES, EMPTY_RECIPES);
  const [text, setText] = useState('');
  const [planning, setPlanning] = useState<string | null>(null);
  const [when, setWhen] = useState({ date: isoDate(), slot: 'dinner' as Slot });

  const add = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const idea = { id: newId(), text: value, recipeId: findRecipe(recipes.data.recipes, value)?.id, by: person, at: new Date().toISOString() };
    meals.update((f) => ({ ...f, ideas: [...f.ideas, idea] }), `Meal idea: ${value}`).catch(() => {});
    setText('');
  };

  const remove = (id: string) => meals.update((f) => ({ ...f, ideas: f.ideas.filter((i) => i.id !== id) }), 'Remove meal idea').catch(() => {});

  const plan = (id: string) => {
    const idea = meals.data.ideas.find((i) => i.id === id);
    if (!idea) return;
    meals
      .update(
        (f) =>
          prune({
            plan: { ...f.plan, [when.date]: { ...(f.plan[when.date] ?? {}), [when.slot]: { text: idea.text, recipeId: idea.recipeId, by: idea.by } } },
            ideas: f.ideas.filter((i) => i.id !== id),
          }),
        `Plan meal idea: ${idea.text}`,
      )
      .catch(() => {});
    setPlanning(null);
  };

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <div>
      <h2>Meal ideas</h2>
      <p className="hint">Cravings, requests or "let's try this". Anyone can add one.</p>
      <form className="inline-form" onSubmit={add}>
        <input list="idea-recipes" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Laksa one evening?" />
        <RecipeOptions id="idea-recipes" />
        <button className="pill" disabled={!text.trim()}>
          Add
        </button>
      </form>
      {meals.data.ideas.length === 0 ? null : (
        <ul className="list">
          {meals.data.ideas.map((i) => (
            <li key={i.id}>
              <div className="list-main">
                <MealText entry={i} />
                <small>from {i.by}</small>
              </div>
              {planning === i.id ? (
                <div className="row wrap">
                  <select value={when.date} onChange={(e) => setWhen({ ...when, date: e.target.value })}>
                    {days.map((d) => (
                      <option key={isoDate(d)} value={isoDate(d)}>
                        {dayLabel(d)}
                      </option>
                    ))}
                  </select>
                  <select value={when.slot} onChange={(e) => setWhen({ ...when, slot: e.target.value as Slot })}>
                    {SLOTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button className="pill" onClick={() => plan(i.id)}>
                    Add to plan
                  </button>
                  <button className="pill ghost" onClick={() => setPlanning(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="row">
                  <button className="pill ghost" onClick={() => setPlanning(i.id)}>
                    Plan it
                  </button>
                  <button className="icon-button" aria-label="Remove idea" onClick={() => remove(i.id)}>
                    ✕
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PlanView() {
  const meals = useDoc<MealsFile>(MEALS, EMPTY_MEALS);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState<{ date: string; slot: Slot } | null>(null);
  const monday = addDays(startOfWeek(new Date()), weekOffset * 7);
  const today = isoDate();
  // Past days aren't useful to plan, so the current week starts from today.
  const days = Array.from({ length: 7 }, (_, i) => isoDate(addDays(monday, i))).filter((d) => d >= today);

  return (
    <div>
      <StatusLine doc={meals} />
      <div className="week-nav">
        <button className="icon-button" aria-label="Previous week" disabled={weekOffset <= 0} onClick={() => setWeekOffset(weekOffset - 1)}>
          ‹
        </button>
        <strong>{weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : `Week of ${monday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}</strong>
        <button className="icon-button" aria-label="Next week" disabled={weekOffset >= 3} onClick={() => setWeekOffset(weekOffset + 1)}>
          ›
        </button>
      </div>
      {days.map((date) => (
        <div key={date} className={`day ${date === today ? 'is-today' : ''}`}>
          <h3>{dayLabel(fromIso(date))}</h3>
          {SLOTS.map(({ id, label }) => {
            const entry = meals.data.plan[date]?.[id];
            const isEditing = editing?.date === date && editing.slot === id;
            return (
              <div key={id} className="slot">
                <span className="slot-label">{label}</span>
                {isEditing ? (
                  <SlotEditor date={date} slot={id} done={() => setEditing(null)} />
                ) : (
                  <div className="slot-value">
                    {entry ? <MealText entry={entry} /> : <span className="muted">—</span>}
                    <button className="link small" onClick={() => setEditing({ date, slot: id })}>
                      {entry ? 'Change' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <Ideas />
    </div>
  );
}

export function MealsToday() {
  const meals = useDoc<MealsFile>(MEALS, EMPTY_MEALS);
  const today = meals.data.plan[isoDate()] ?? {};
  const planned = SLOTS.filter((s) => today[s.id]);
  if (planned.length === 0) return <Empty>Nothing planned yet for today.</Empty>;
  return (
    <ul className="kv">
      {planned.map((s) => (
        <li key={s.id}>
          <span>{s.label}</span>
          <MealText entry={today[s.id]!} />
        </li>
      ))}
    </ul>
  );
}
