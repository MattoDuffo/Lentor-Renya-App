import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { newId, useDoc } from '../../core/useDoc';
import { useSession } from '../../core/session';
import { Photo, PhotoListEditor } from '../../core/photos';
import { RichText } from '../../ui/RichText';
import { Empty, PageHeader, confirmDelete } from '../../ui/Page';
import { StatusLine } from '../../ui/StatusLine';
import { EMPTY_MEALS, EMPTY_RECIPES, MEALS, RECIPES, type MealsFile, type Recipe, type RecipesFile } from './data';

export function RecipeList() {
  const doc = useDoc<RecipesFile>(RECIPES, EMPTY_RECIPES);
  const [filter, setFilter] = useState('');
  const f = filter.trim().toLowerCase();
  const list = doc.data.recipes
    .filter((r) => !f || `${r.title} ${r.ingredients} ${r.notes}`.toLowerCase().includes(f))
    .sort((a, b) => a.title.localeCompare(b.title));
  return (
    <div>
      <StatusLine doc={doc} />
      <div className="row">
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a recipe or ingredient" />
        <Link className="pill" to="new">
          + Add
        </Link>
      </div>
      {list.length === 0 && !doc.loading && <Empty>{f ? 'No matching recipes.' : 'No recipes yet. Add a family favourite.'}</Empty>}
      <ul className="recipe-grid">
        {list.map((r) => (
          <li key={r.id}>
            <Link to={r.id}>
              {r.photos[0] ? <Photo path={r.photos[0]} className="recipe-photo" /> : <div className="recipe-photo placeholder">🍲</div>}
              <span>{r.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecipeView() {
  const { id } = useParams();
  const { person } = useSession();
  const doc = useDoc<RecipesFile>(RECIPES, EMPTY_RECIPES);
  const meals = useDoc<MealsFile>(MEALS, EMPTY_MEALS);
  const [suggested, setSuggested] = useState(false);
  const r = doc.data.recipes.find((x) => x.id === id);
  if (!r) return <section><PageHeader title="Recipe" back="/meals/recipes" />{doc.loading ? <StatusLine doc={doc} /> : <Empty>This recipe was removed.</Empty>}</section>;

  const suggest = () => {
    meals
      .update((f) => ({ ...f, ideas: [...f.ideas, { id: newId(), text: r.title, recipeId: r.id, by: person, at: new Date().toISOString() }] }), `Meal idea: ${r.title}`)
      .catch(() => {});
    setSuggested(true);
  };

  return (
    <article>
      <PageHeader
        title={r.title}
        back="/meals/recipes"
        action={
          <Link className="pill" to="edit">
            Edit
          </Link>
        }
      />
      {r.photos.map((p) => (
        <Photo key={p} path={p} className="photo" />
      ))}
      {r.notes && (
        <div className="callout">
          <RichText text={r.notes} />
        </div>
      )}
      {r.ingredients && (
        <>
          <h2>Ingredients</h2>
          <RichText text={r.ingredients.split('\n').filter((l) => l.trim()).map((l) => (/^\s*[-•*]/.test(l) ? l : `- ${l}`)).join('\n')} />
        </>
      )}
      {r.steps && (
        <>
          <h2>Steps</h2>
          <RichText text={r.steps} />
        </>
      )}
      <button className="secondary" disabled={suggested} onClick={suggest}>
        {suggested ? 'Added to meal ideas ✓' : 'Add to meal ideas'}
      </button>
      <p className="hint">Added by {r.addedBy}</p>
    </article>
  );
}

export function RecipeEditor() {
  const { id } = useParams();
  const doc = useDoc<RecipesFile>(RECIPES, EMPTY_RECIPES);
  const existing = doc.data.recipes.find((x) => x.id === id);
  if (id && !existing) {
    return (
      <section>
        <PageHeader title="Recipe" back="/meals/recipes" />
        {doc.loading ? <StatusLine doc={doc} /> : <Empty>This recipe was removed.</Empty>}
      </section>
    );
  }
  return <RecipeForm key={existing?.id ?? 'new'} existing={existing} />;
}

function RecipeForm({ existing }: { existing?: Recipe }) {
  const navigate = useNavigate();
  const { person } = useSession();
  const doc = useDoc<RecipesFile>(RECIPES, EMPTY_RECIPES);
  const [d, setD] = useState({
    title: existing?.title ?? '',
    ingredients: existing?.ingredients ?? '',
    steps: existing?.steps ?? '',
    notes: existing?.notes ?? '',
    photos: existing?.photos ?? [],
  });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const recipe: Recipe = {
      ...d,
      title: d.title.trim(),
      id: existing?.id ?? newId(),
      addedBy: existing?.addedBy ?? person,
      updatedAt: new Date().toISOString(),
    };
    try {
      await doc.update((f) => ({ recipes: [...f.recipes.filter((x) => x.id !== recipe.id), recipe] }), `${existing ? 'Update' : 'Add'} recipe: ${recipe.title}`);
      navigate(`/meals/recipes/${recipe.id}`, { replace: true });
    } catch {
      /* shown by StatusLine */
    }
  };

  const remove = async () => {
    if (!existing || !confirmDelete(`"${existing.title}"`)) return;
    try {
      await doc.update((f) => ({ recipes: f.recipes.filter((x) => x.id !== existing.id) }), `Remove recipe: ${existing.title}`);
      navigate('/meals/recipes', { replace: true });
    } catch {
      /* shown by StatusLine */
    }
  };

  return (
    <section>
      <PageHeader title={existing ? 'Edit recipe' : 'New recipe'} back={existing ? `/meals/recipes/${existing.id}` : '/meals/recipes'} />
      <form className="form" onSubmit={save}>
        <label>
          Name
          <input required value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="e.g. Chicken rendang" />
        </label>
        <label>
          Family notes
          <textarea rows={3} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="e.g. Lesley likes it less spicy" />
        </label>
        <label>
          Ingredients (one per line)
          <textarea rows={6} value={d.ingredients} onChange={(e) => setD({ ...d, ingredients: e.target.value })} />
        </label>
        <label>
          Steps (one per line, or "1. ", "2. ")
          <textarea rows={8} value={d.steps} onChange={(e) => setD({ ...d, steps: e.target.value })} />
        </label>
        <label>Photos</label>
        <PhotoListEditor photos={d.photos} onChange={(photos) => setD({ ...d, photos })} />
        <StatusLine doc={doc} />
        <button className="primary" disabled={doc.saving || !d.title.trim()}>
          {doc.saving ? 'Saving…' : 'Save'}
        </button>
        {existing && (
          <button type="button" className="link danger" onClick={remove}>
            Delete this recipe
          </button>
        )}
      </form>
    </section>
  );
}
