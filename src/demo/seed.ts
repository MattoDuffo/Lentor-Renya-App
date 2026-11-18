import { addDays, isoDate } from '../core/dates';

/**
 * Sample content for "try it out" mode only. Never written to GitHub unless
 * someone edits it while connected, and it contains nothing real about the household.
 */
const now = new Date().toISOString();
const today = isoDate();
const tomorrow = isoDate(addDays(new Date(), 1));
const weekday = new Date().getDay();

export const seed: Record<string, unknown> = {
  'guide.json': {
    articles: [
      {
        id: 'g1',
        title: 'Washing machine settings',
        topic: 'Laundry',
        body: 'Most things go on the 40° cotton cycle.\n\n- Towels and bedsheets: 60°\n- Delicates and wool: hand-wash cycle, low spin\n- Dark clothes inside out\n\nAny doubts, just leave it aside and ask.',
        photos: [],
        updatedBy: 'Lesley',
        updatedAt: now,
      },
      {
        id: 'g2',
        title: 'Where the spare light bulbs are',
        topic: 'Where things go',
        body: 'Top shelf of the storeroom, in the clear box labelled "Bulbs".',
        photos: [],
        updatedBy: 'Mat',
        updatedAt: now,
      },
      {
        id: 'g3',
        title: 'Cleaning the oven',
        topic: 'Kitchen',
        body: '1. Let it cool completely\n2. Take out the racks and soak them\n3. Spray the cleaner, wait 20 minutes\n4. Wipe with the yellow sponge (not the green scrubber)',
        photos: [],
        updatedBy: 'Renya',
        updatedAt: now,
      },
    ],
  },
  'routines.json': {
    routines: [
      { id: 'r1', title: 'Water the balcony plants', repeat: { kind: 'daily' }, time: 'morning' },
      { id: 'r2', title: 'Take out recycling', notes: 'Blue bin by the lift', repeat: { kind: 'weekly', days: [weekday, (weekday + 3) % 7] }, time: 'evening' },
      { id: 'r3', title: 'Change bedsheets', notes: 'Spare sets are in the hall cupboard', repeat: { kind: 'weekly', days: [1] }, time: '' },
      { id: 'r4', title: 'Clean aircon filters', repeat: { kind: 'monthly', day: 1 }, time: '' },
    ],
  },
  'recipes.json': {
    recipes: [
      {
        id: 'rc1',
        title: 'Chicken rendang',
        ingredients: '1 kg chicken thighs\n400 ml coconut milk\n3 lemongrass stalks\nRendang paste\nKaffir lime leaves',
        steps: '1. Fry the paste until fragrant\n2. Add chicken and lemongrass, coat well\n3. Pour in coconut milk and simmer for 1 hour, stirring now and then\n4. Add lime leaves and cook until thick',
        notes: 'Lesley likes it less spicy. Mat loves it with extra sambal on the side.',
        photos: [],
        addedBy: 'Renya',
        updatedAt: now,
      },
      {
        id: 'rc2',
        title: 'Overnight oats',
        ingredients: '1 cup oats\n1 cup milk\n2 tbsp yoghurt\nHoney\nBerries',
        steps: 'Mix everything except the berries the night before. Top with berries in the morning.',
        notes: '',
        photos: [],
        addedBy: 'Lesley',
        updatedAt: now,
      },
    ],
  },
  'meals.json': {
    plan: {
      [today]: { breakfast: { text: 'Overnight oats', recipeId: 'rc2', by: 'Lesley' }, dinner: { text: 'Chicken rendang', recipeId: 'rc1', by: 'Renya' } },
      [tomorrow]: { dinner: { text: 'Fish soup', by: 'Mat' } },
    },
    ideas: [{ id: 'i1', text: 'Laksa one evening?', by: 'Mat', at: now }],
  },
  'shopping.json': {
    items: [
      { id: 's1', name: 'Milk', qty: '2 cartons', shop: 'Supermarket', by: 'Renya', done: false },
      { id: 's2', name: 'Kaffir lime leaves', shop: 'Wet market', by: 'Renya', done: false },
      { id: 's3', name: 'Dishwasher tablets', shop: 'Online', note: 'The lemon ones', by: 'Lesley', done: false },
    ],
    shops: ['Supermarket', 'Wet market', 'Online', 'Pharmacy', 'Other'],
    known: [],
  },
  'notes.json': {
    notes: [
      { id: 'n1', author: 'Lesley', text: 'Plumber is coming Tuesday at 10am to look at the kitchen tap.', createdAt: now },
      { id: 'n2', author: 'Mat', text: 'Thank you for the amazing rendang last night! 🙏', createdAt: now },
    ],
  },
};
