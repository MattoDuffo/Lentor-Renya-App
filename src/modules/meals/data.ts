import { isoDate, addDays } from '../../core/dates';

export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  notes: string;
  photos: string[];
  addedBy: string;
  updatedAt: string;
}

export interface RecipesFile {
  recipes: Recipe[];
}

export type Slot = 'breakfast' | 'lunch' | 'dinner';
export const SLOTS: { id: Slot; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

export interface MealEntry {
  text: string;
  recipeId?: string;
  by: string;
}

export interface Idea {
  id: string;
  text: string;
  recipeId?: string;
  by: string;
  at: string;
}

export interface MealsFile {
  plan: Record<string, Partial<Record<Slot, MealEntry>>>;
  ideas: Idea[];
}

export const RECIPES = 'recipes.json';
export const MEALS = 'meals.json';
export const EMPTY_RECIPES: RecipesFile = { recipes: [] };
export const EMPTY_MEALS: MealsFile = { plan: {}, ideas: [] };

/** Drop plan days older than a week so the file stays small. */
export function prune(f: MealsFile): MealsFile {
  const cutoff = isoDate(addDays(new Date(), -7));
  return { ...f, plan: Object.fromEntries(Object.entries(f.plan).filter(([d]) => d >= cutoff)) };
}

export function findRecipe(recipes: Recipe[], text: string): Recipe | undefined {
  const t = text.trim().toLowerCase();
  return recipes.find((r) => r.title.trim().toLowerCase() === t);
}
