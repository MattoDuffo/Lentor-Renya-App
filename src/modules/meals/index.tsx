import { NavLink, Route, Routes } from 'react-router-dom';
import { defineModule } from '../../core/module';
import { PageHeader } from '../../ui/Page';
import { MealsToday, PlanView } from './Plan';
import { RecipeEditor, RecipeList, RecipeView } from './Recipes';
import { EMPTY_RECIPES, RECIPES, type RecipesFile } from './data';

function Tabs() {
  return (
    <nav className="subtabs">
      <NavLink to="/meals" end>
        Meal plan
      </NavLink>
      <NavLink to="/meals/recipes">Recipes</NavLink>
    </nav>
  );
}

function WithTabs({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <PageHeader title="Meals" />
      <Tabs />
      {children}
    </section>
  );
}

function MealsPage() {
  return (
    <Routes>
      <Route index element={<WithTabs><PlanView /></WithTabs>} />
      <Route path="recipes" element={<WithTabs><RecipeList /></WithTabs>} />
      <Route path="recipes/new" element={<RecipeEditor />} />
      <Route path="recipes/:id" element={<RecipeView />} />
      <Route path="recipes/:id/edit" element={<RecipeEditor />} />
    </Routes>
  );
}

export default defineModule({
  id: 'meals',
  title: 'Meals',
  icon: '🍲',
  description: 'Meal plan, ideas and our recipe book',
  Page: MealsPage,
  TodayCard: MealsToday,
  todayOrder: 10,
  search: [
    {
      path: RECIPES,
      empty: EMPTY_RECIPES,
      items: (f: RecipesFile) =>
        f.recipes.map((r) => ({ title: r.title, snippet: 'Recipe', text: `${r.ingredients} ${r.notes}`, to: `/meals/recipes/${r.id}` })),
    },
  ],
});
