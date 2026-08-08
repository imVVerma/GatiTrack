# Gati — Deployment & Full QA Prompt (for Antigravity)

Good progress on the backend migration — this prompt covers what's left to make it actually usable day-to-day: real deployment (so it's testable across devices, not just the dev machine) and a full QA pass covering both the backend migration and the earlier layout fixes.

## 1. Deployment

- **Backend:** deploy to Railway (as originally specced). Postgres on Neon, production instance — not the local dev database used for smoke testing so far.
- **PIN:** set via Railway environment variable in the production deploy, not hardcoded.
- **Frontend:** deploy so it's reachable from both a laptop browser and a phone browser over the internet (Vercel is the natural choice given the rest of the stack/your usual pattern — Antigravity's call if there's a reason to prefer otherwise).
- **CORS:** confirm the deployed frontend origin is allowed on the deployed backend — this is a common miss and would silently break everything.
- Confirm the PWA installs correctly from the deployed URL (not just localhost) on an actual phone.

## 2. Full QA Pass — Backend Migration

Beyond the checklist + daily-entry smoke test already done, verify against the **deployed** backend:

- [ ] Login with correct PIN works from a fresh browser/device with no prior session
- [ ] Wrong PIN is rejected
- [ ] Session persists across reload without re-prompting
- [ ] Class CRUD (create/edit/archive) works end-to-end against the deployed backend
- [ ] Task CRUD (create/edit/archive) works end-to-end against the deployed backend
- [ ] Data created on one device/browser appears on a second device/browser after refresh — for checklist items, daily entries, classes, AND tasks (this is the actual point of the whole migration — test all four, not just checklist)
- [ ] One-time Dexie-to-Postgres import correctly preserved the original 15 checklist items and any pre-existing logged entries (re-confirm this still holds after the backend rewire)

## 3. Full QA Pass — Layout Fixes

These were UI-only changes made before the backend rewire — confirm they survived and still work correctly now that the UI is wired to backend state instead of Dexie:

- [ ] Clicking Schedule shows only Schedule content — no Checklist content visible or reachable by scrolling
- [ ] Clicking Checklist shows only Checklist content, same rule
- [ ] Switching tabs back and forth preserves internal state per section (e.g. selected date in History)
- [ ] Today view shows no creation date per item
- [ ] Today view renders as a dense multi-column checkbox-chip grid, not a vertical list
- [ ] Checking an item mutes it and moves it to the end of the grid; unchecking restores it
- [ ] All dates throughout the app display DD/MM/YYYY

## 4. Dexie Cleanup

Once everything above is confirmed working against the deployed backend (not before):
- Remove the Dexie fallback/local-write paths entirely — backend should be the only data path from here on
- Confirm `npm run build` still passes after removal

## 5. Report Back

Use the established report format (pass/fail per checklist item above across all four sections, deviations, known issues, deployed URLs for both frontend and backend). Specifically include the actual deployed URLs so they can be opened directly for review.
