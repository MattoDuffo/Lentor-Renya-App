# Kampung Lentor

A small web app for the Lentor household: the day at a glance and answers to
everyday questions. See [PLAN.md](PLAN.md) for the goals, principles and roadmap.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173/Lentor-Renya-App/
npm run build
```

On first open, pick a person and choose **Just try it out** to use data saved
in your browser only.

## Adding a section

1. Create `src/modules/<id>/index.tsx` exporting `defineModule({ id, title, icon, Page, TodayCard? })`.
2. Add it to the list in `src/modules/index.ts`.

Store shared data with `useDoc('<file>.json', emptyValue)`. It handles loading,
offline caching, refreshing and saving (with retry if someone else saved first).

## Going live (one-time)

1. Make the repository private (needs GitHub Pro) so household data isn't public.
2. **Settings → Pages → Source: GitHub Actions.** Each push to `main` deploys
   to `https://mattoduffo.github.io/Lentor-Renya-App/`.
3. Create one access key per phone: **Settings → Developer settings →
   Fine-grained tokens → Generate new token**
   - Repository access: *Only select repositories* → this repo
   - Permissions: *Contents → Read and write* (nothing else)
   - Name it after the phone owner, so it can be cancelled on its own if a phone is lost.
4. Open the site on each phone, pick the person, paste the key, then use
   **Add to Home Screen**.

Household data is stored as JSON on the `household-data` branch (created
automatically on the first save). It is never part of the built website.
