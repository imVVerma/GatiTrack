# Gati — Phase 1 PRD (Checklist / Habit Log)

*"Gati" (Hindi: momentum) — a personal daily consistency tracker.*

## 1. Overview

A standalone PWA, separate from the phone's built-in calendar, for tracking personal daily routines. Long-term it will also cover class schedules and task/assignment deadlines, but **Phase 1 scope is limited to the checklist/habit tracker only.**

**Core goal:** let the user maintain an editable list of daily checklist items, log completion per date, view history for any past date, and get reminded during the day so no date gets missed.

## 2. Users

Single user, local device only. No accounts, no multi-user support needed.

## 3. Tech Stack

- **Frontend:** React + Vite + Tailwind + shadcn/ui
- **Storage:** IndexedDB via Dexie.js — fully local, no sync
- **PWA:** installable on phone home screen, service worker for offline use
- **Notifications:** Web Push via a minimal backend relay (needed even though data is local — browser push requires a server to trigger delivery when the app isn't open). Lightweight FastAPI or a serverless function (e.g. Vercel function) just for sending push payloads at scheduled times; holds no user data beyond a push subscription token.

## 4. Data Model (draft)

### 4.1 Seed Checklist Items (v1 defaults, user-editable anytime)

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

*(15 items — matches the "10 out of 15 = ~67%, rounds close to 70%" example given during scoping)*

**ChecklistItem**
- `id`
- `label` (string)
- `createdAt`
- `archivedAt` (nullable — soft-delete so history isn't broken when items are removed later)
- `sortOrder`

**DailyEntry**
- `id`
- `date` (YYYY-MM-DD, local)
- `itemId` (FK → ChecklistItem)
- `completed` (boolean)
- `loggedAt` (timestamp)

**DailyCompletionSummary** (derived/cached per date, for calendar rendering)
- `date`
- `totalActiveItems`
- `completedCount`
- `completionRate` (completedCount / totalActiveItems)
- `isGoodDay` (completionRate ≥ 0.70)

## 5. Features

### 5.1 Checklist management
- Add / edit / rename / archive checklist items at any time
- Archiving (not hard delete) so past history for that item stays intact
- Reorder items

### 5.2 Daily logging
- One screen per "today" showing all active checklist items with a toggle/checkbox
- Marking complete/incomplete writes a `DailyEntry` for that date + item
- Items added mid-stream only appear starting from their creation date (no retroactive entries required)

### 5.3 History / log view
- Calendar or list view to jump to any past date
- Shows which items were logged and their completion state for that date
- Dates with no entries at all are simply blank (distinguish "didn't log" vs "logged as incomplete")

### 5.4 Consistency Tracking (replaces streaks)
- No streak counters. Instead, track **completion rate per day**: (items completed) / (items active that day)
- **Calendar/month view** is the primary history UI — one tile per date
- Any date with a completion rate ≥ a threshold (default **70%**, configurable later) gets a visual marker — special color/badge on that date tile
- Dates with no entries logged at all stay visually blank/neutral (distinct from "logged but low completion")
- Tapping a date opens the detail view for that day (which items were done/not done — same as section 5.3)
- User can start logging mid-month (e.g. from the 10th) — days before that are just blank/unlogged, not counted against them

### 5.5 Reminders
- Two reminder notifications per day by default: afternoon + night
- Reminder fires only if today's entry hasn't been fully logged yet
- Times configurable later; hardcode sensible defaults for v1 (e.g. 3 PM / 9 PM) and revisit

### 5.6 PWA
- Installable, works offline, syncs nothing (local-only by design)

## 6. Non-goals for Phase 1

- No class schedule
- No tasks/deadlines/meetings
- No multi-device sync
- No accounts/auth

## 7. Future Phases (for context, not building now)

- **Phase 2:** One-off tasks/deadlines (assignments, meetings) with push reminders
- **Phase 3:** Weekly recurring class schedule; combined daily/weekly view merging all three

## 8. Open Questions

1. ~~Confirm the 70% completion threshold~~ — **Confirmed: 70%**
2. ~~Checklist items to seed~~ — **Confirmed, see Section 4.1**
3. ~~App name~~ — **Confirmed: Gati**

All open questions resolved. Ready for build.

## 9. Build Approach

Following your usual workflow: this PRD → phased build prompts for Antigravity → verification checklist at each milestone. Suggest breaking Phase 1 into:
- Milestone A: Data layer + checklist CRUD
- Milestone B: Daily logging screen + history view
- Milestone C: Consistency calendar (completion rate calc + 70% threshold marker)
- Milestone D: PWA install + push notification relay
