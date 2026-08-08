# Gati — Backend Migration Prompt (for Antigravity)

**Priority: this replaces the current local-only Dexie storage. Pause any further UI work on the Schedule section until this is done.**

## Why this is needed

The original spec called for a shared FastAPI + Postgres backend with PIN auth, specifically so checklist/schedule data is identical on laptop and mobile. The current build uses local Dexie (IndexedDB) for both the Phase 1 checklist and Phase 2 schedule data — this only lives on whichever single device it was entered on and does not sync. This prompt migrates both to the shared backend. No new UI is being requested here — this is a data-layer swap underneath the existing screens.

## 1. Backend Setup

- FastAPI app, deployed on Railway
- Postgres database on Neon
- Single shared PIN auth (env-configured PIN), same lightweight approach as originally specced: PIN entry screen on first load per device → exchanged for a session token → token stored locally on that device so the PIN isn't re-asked every visit
- CORS configured to allow the deployed frontend origin(s)

## 2. Schema (mirror existing Dexie tables into Postgres)

Look at the current Dexie schema in `src/lib/db.ts` and `src/lib/types.ts` and translate it directly — table/field names can stay consistent with what's already there to minimize frontend rewrite surface. At minimum, these tables:

- `checklist_items` (id, label, created_at, archived_at, sort_order)
- `daily_entries` (id, date [ISO date type], item_id [FK], completed, logged_at)
- `class_schedule` (id, name, day_of_week, start_time, end_time, room_or_link, notes, archived_at)
- `tasks` (id, title, due_date, due_time, category, notes, completed, archived_at)

## 3. Data Migration (one-time)

The current Dexie database has real data in it — specifically the 15 checklist items already defined, and possibly some logged `daily_entries` from testing/use so far. Do not discard this.

- Write a one-time migration script (can be a temporary admin route, a CLI script, or a manual export/import flow — whatever's fastest) that reads the existing Dexie data from the browser and pushes it into the new Postgres tables, preserving:
  - All 15 checklist items, in their current order
  - Any existing `daily_entries` already logged against them
  - Any class/task entries already created in the Schedule section, if present
- After migration is confirmed complete and verified, the frontend should stop reading/writing Dexie for these tables entirely (Dexie can be removed or kept only as a fallback shell — Antigravity's call, but it should not be the active data source anymore)

## 4. Frontend Changes

- Replace all Dexie read/write calls (checklist, daily entries, classes, tasks) with calls to the new backend API
- Add the PIN entry screen (first load per device) and session token storage
- No changes to layout, components, or the Day/Week/Month/Manage views themselves — this is purely swapping the data layer underneath what's already built
- Note: offline support is explicitly out of scope (as originally specced) — the app requires connectivity to read/write data now that Postgres is the source of truth

## 5. Verification Checklist

- [ ] Migration preserves all 15 original checklist items in original order
- [ ] Any pre-existing logged `daily_entries` show up correctly after migration (spot-check a few dates)
- [ ] Any pre-existing class/task entries survive migration
- [ ] Adding/checking off a checklist item on one device is visible on a different device/browser after refresh
- [ ] Adding a class or task on one device is visible on a different device/browser after refresh
- [ ] Wrong PIN rejected; correct PIN persists session without re-prompting every visit
- [ ] `npm run build` still passes
- [ ] Dexie is no longer the active read/write path for these tables

## 6. Report Back

Use the same report format already established for Phase 1/2 (pass/fail per item above, deviations, known issues, deployed URLs). Specifically call out: what happened to the pre-existing local data during migration (fully preserved / partially preserved / lost — be honest here, this matters).
