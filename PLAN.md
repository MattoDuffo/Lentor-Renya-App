# Lentor Household App — Plan

A small web app for the Lentor household: Mat, Lesley and Renya.

## Purpose

**Renya should find this app useful.** It is a convenient way for her to see
her day at a glance and to find answers to everyday questions ("Where do the
spare bulbs go?", "What's for dinner Thursday?", "How does Lesley like her
coffee?") without having to ask.

### Design principles

1. **Helpful, not monitoring.** Nothing reports Renya's activity back to Mat and
   Lesley. There are no read receipts, no "task completed at 14:32" logs, no
   activity dashboards and no performance tracking. Checklists are a memory aid
   for her, and tick marks reset each day without leaving a history.
2. **A shared home, not a rulebook.** Content is written as guidance and
   context ("We like…", "Easiest way to…"), not as orders. Renya can add and
   edit content too: her own recipes, tips, notes, shopping items.
3. **Two-way.** Anything Mat and Lesley can post (a meal idea, a calendar
   entry, a note), Renya can post too.
4. **Quiet.** No push notifications or nagging. The app shows what's new when
   it's opened.
5. **Fast answers.** Search across everything comes first. Phone-first, big
   tap targets, works on iPhone and Android.
6. **Sensitive data stays out.** No salary, IDs, documents or passwords.

## Look and feel

Derived from the **Lentor Beach Club** logo (a happy red panda by the pool):
sunny, relaxed and friendly, like a holiday rather than an office.

| Role | Light | Dark ("after sunset") | From the logo |
|---|---|---|---|
| Background | `#fff7ec` | `#18120f` | warm sand |
| Text | `#3a1d14` | `#f8ebdd` | panda brown |
| Headings | `#1e3a6b` | `#a9c6f0` | sign navy |
| Buttons, links | `#0b7590` | `#45c3dd` | pool turquoise |
| Highlights (active tab, selection, note edge) | `#f0661a` | `#ff8b45` | panda orange |
| Occasional accent | `#f47c98` | `#ff9ab2` | flamingo |

Type: **Nunito** (rounded and friendly) for everything, and **Pacifico** (the
logo's script feel) only for greetings. Fonts are bundled so they work offline.
Soft rounded cards, pill buttons and the logo illustration at the top of Today.
Text colour pairs meet WCAG AA contrast.

## Sections (modules)

### First version
| Module | What it is |
|---|---|
| **Today** | Home screen: today's meals, calendar items (guests, deliveries, who's away), routine reminders, anything new since last visit. |
| **Search** | One search box across house guide, recipes, photos and notes. |
| **House guide** | Short guides by topic (kitchen, laundry, appliances, where things go), with photos. Written as how-tos and preferences, not as rules. |
| **Routines** | Recurring daily, weekly and monthly reminders (e.g. "1st of the month: aircon filters"). A personal checklist that resets; no history kept. |
| **Meals & recipes** | Weekly meal plan linked to a shared recipe book with photos and family notes. Anyone can suggest a meal or add a recipe. |
| **Shopping list** | Shared list grouped by shop, with optional product photos. Anyone adds; anyone ticks off. |
| **Notes** | A simple shared notice board ("Plumber coming Tue 10am", "Thank you for the amazing rendang!"). |

### Next
| Module | What it is |
|---|---|
| **Calendar** | Shared household calendar: who's home or away, guests, events. Renya's days off and plans show here as she enters them. |
| **Days off** | Renya picks her days off or swaps; a lightweight "does this work?" flow, framed around her plans rather than approval. |
| **Holidays** | Mat and Lesley's travel dates plus a relaxed "while we're away" page (plants, mail, any big jobs, and time for herself). |
| **Photo albums** | Generic gallery template ("Wardrobe layout", "How the fridge is organised"). Create new albums from inside the app. |
| **Useful contacts** | Emergency numbers, doctor, building management, handyman, what to do if something breaks. |

### Later (ideas)
Pantry or "running low" list (feeds into Shopping) · birthdays · guest-prep checklist · plant care.

## Architecture

### Modular by design
Each section is a self-contained **module** in `src/modules/<id>/` exposing a
manifest:

```ts
export default defineModule({
  id: 'recipes',
  title: 'Recipes',
  icon: 'chef-hat',
  routes: [...],            // its own screens
  todayCard: RecipesToday,  // optional card on the Today screen
  searchIndex: indexRecipes,// optional contribution to global search
  dataFiles: ['recipes/'],  // where its data lives
});
```

The app shell reads a single registry (`src/modules/index.ts`) to build the tab
bar, routes, Today screen and search. Adding a section is one new folder plus
one line in the registry; nothing else changes.

**Generic templates** (Gallery, Checklist, Guide/Notes, List) let new
content-only sections be created as data, without new code.

### Stack: GitHub only
| Piece | Choice |
|---|---|
| App | React + TypeScript + Vite, installable as a web app (PWA) |
| Hosting | **GitHub Pages**, auto-deployed by GitHub Actions on push to `main` |
| Data | JSON files on a separate **`household-data` branch** of this repo, never bundled into the website |
| Read/write | The app talks to the GitHub API with a fine-grained access key (token) scoped to this repo, entered once per phone |
| People | Each phone picks who it belongs to (Mat, Lesley or Renya); posts show that name |
| Offline | Last-loaded data is cached on the phone, so the app still works with poor signal |

**Privacy.** The repo will be made **private** once on GitHub Pro (Pages from a
private repo needs a paid plan). Even then, a Pages *website* is reachable by
anyone with its address. So the website only contains the empty app, and all
household content is fetched from the private repo with the access key. Until
the repo is private, only sample data is used and no household content is
committed.

What this means in practice:
- No servers to run, and everything is versioned on GitHub. Mat and Lesley can
  also edit content directly on github.com (`household-data` branch).
- Updates are not instant. The app refreshes when opened and about every 45 s
  while open. That is fine for a household.
- No push notifications (which also fits principle 4).
- Simultaneous edits to the same file are detected and merged by retrying.
- Each phone holds a key, so a lost phone means cancelling that key on GitHub.

## Roadmap

1. **Foundations**: Vite/React/TS scaffold, PWA setup, GitHub Pages deploy
   workflow, module registry and app shell (tab bar, routing), GitHub data
   layer (read, write, cache, conflict retry), first-run token setup, data repo
   schema plus seed content.
2. **First version**: Today, Search, House guide, Routines, Meals & recipes,
   Shopping list, Notes.
3. **Next**: Calendar, Days off, Holidays, Photo albums, Useful contacts.
4. **Use it for a few weeks, ask Renya what helps, adjust.**

## Status
- [x] Plan agreed
- [x] Foundations: scaffold, PWA, Pages deploy workflow, module registry and
  shell, GitHub data layer with offline cache and conflict retry, first-run
  setup ("who are you" plus access key, or try-it-out mode), Notes module
- [ ] Switch to GitHub Pro, make repo private, enable Pages, create access keys
- [ ] First version modules
