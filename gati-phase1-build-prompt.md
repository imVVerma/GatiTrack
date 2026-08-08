# Gati — Phase 1 Build Prompt (for Antigravity)

Reference PRD: `checklist-tracker-PRD-phase1.md` (same folder). Read it fully before starting.

Build this as a **React + Vite + Tailwind + shadcn/ui** PWA. Data lives entirely in **IndexedDB via Dexie.js** — no backend for data, no accounts, no sync. Push notifications (Milestone D) use a minimal separate relay — do not conflate this with data storage.

Work through the milestones **in order**. Do not start a milestone until the previous one is verified. After each milestone, stop and report what was built against the verification checklist below before proceeding.

---

## Milestone A — Data Layer + Checklist CRUD

**Build:**
- Dexie.js schema: `ChecklistItem` table (`id`, `label`, `createdAt`, `archivedAt`, `sortOrder`) and `DailyEntry` table (`id`, `date`, `itemId`, `completed`, `loggedAt`)
- Seed the database on first run with these 15 items (in this order):
  1. Sample item 1
  2. Sample item 2
  3. Sample item 3
  4. Sample item 4
  5. Sample item 5
  6. Sample item 6
  7. Sample item 7
  8. Sample item 8
  9. Sample item 9
  10. Sample item 10
  11. Sample item 11
  12. Sample item 12
  13. Sample item 13
  14. Sample item 14
  15. Sample item 15
- A settings/manage screen: add new item, rename item, archive item (soft delete — never hard delete, so history stays intact), reorder items (drag or up/down)

**Verification checklist:**
- [ ] Fresh install seeds exactly these 15 items in order
- [ ] Adding a new item persists after page reload
- [ ] Archiving an item removes it from today's logging view but does NOT delete its past `DailyEntry` records
- [ ] Reordering persists after reload

---

## Milestone B — Daily Logging Screen + History View

**Build:**
- "Today" screen: lists all active (non-archived) checklist items as toggleable checkboxes; toggling writes/updates a `DailyEntry` for today's date + that item
- History view: calendar or list to navigate to any past date; selecting a date shows the same checklist UI in read/edit mode for that date's `DailyEntry` records
- A date with zero `DailyEntry` records must render visually distinct from a date with entries logged (even if all marked incomplete) — "not logged" vs "logged, 0% complete" are different states
- Items only appear on dates on/after their `createdAt` — don't show items retroactively on dates before they existed

**Verification checklist:**
- [ ] Checking/unchecking an item on "today" persists immediately (survives reload)
- [ ] Navigating to a past date shows the correct historical state for that date
- [ ] Unlogged past dates are visually distinct from logged-but-empty dates
- [ ] An item created today does not appear when viewing a date before it was created

---

## Milestone C — Consistency Calendar (70% threshold)

**Build:**
- Month calendar view as the primary history navigation (replaces/wraps the history view from Milestone B)
- For each date with entries, compute `completionRate = completedCount / totalActiveItemsThatDay`
- Any date with `completionRate >= 0.70` gets a distinct visual marker (special color/badge) on its calendar tile
- Dates with no entries stay neutral/blank
- Dates with entries but below 70% get a normal (non-highlighted) but still "logged" appearance
- Tapping any date opens that date's detail view (from Milestone B)
- Threshold (0.70) should be a single named constant, easy to change later — not hardcoded in multiple places

**Verification checklist:**
- [ ] A day with 10/15 items complete (66.7%) does NOT get the marker (below 70%)
- [ ] A day with 11/15 items complete (73.3%) DOES get the marker
- [ ] A day with zero entries is visually blank, not treated as 0%
- [ ] Changing the threshold constant changes marker behavior across the whole calendar

---

## Milestone D — PWA Install + Push Notification Relay

**Build:**
- Manifest + service worker so the app is installable on a phone home screen and works offline for all data operations (A–C)
- Web Push subscription flow (request permission, register subscription)
- Minimal backend relay (FastAPI or a Vercel serverless function — Antigravity's choice, keep it as small as possible) whose only job is: hold the push subscription token, and fire two scheduled push notifications per day (default **3 PM** and **9 PM**, easy to change as constants)
- Notification should only fire if today's entries aren't "fully logged" (i.e., not all active items have a `DailyEntry` for today) — this check happens client-side when the notification is tapped/received is fine for v1; the relay itself can just fire on schedule without querying local data (it doesn't have access to IndexedDB)
- Document clearly in a README: what the relay stores (subscription token only, nothing else), and how to deploy/run it

**Verification checklist:**
- [ ] App installs to home screen and opens standalone (no browser chrome)
- [ ] Milestones A–C work fully offline once installed
- [ ] Push notification fires at both scheduled times on a test device
- [ ] Relay codebase confirmed to store nothing except the subscription token

---

## Out of scope for this build (do not implement)

- Class schedules
- Tasks/deadlines/assignments
- Multi-device sync or accounts
- Streak counters (explicitly replaced by the consistency calendar — do not add streak logic)
