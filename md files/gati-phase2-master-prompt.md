# Gati — Phase 2 Master Build Prompt (for Antigravity)

Read this fully before writing any code. This document is self-contained — screen layout, theme, data model, and reporting format are all specified here so no guessing is needed. Reference the Phase 1 PRD and Phase 1 build prompt (same folder) for what already exists; do not rebuild Phase 1 features, only extend around them.

---

## 1. What Phase 2 Adds

Two new content types on top of the existing checklist:
- **Classes** — weekly recurring (day of week + time)
- **Tasks/Deadlines** — one-off items with a due date/time (assignments, meetings, commitments)

These are grouped together under a new **"Schedule"** section, kept **separate from Checklist** to avoid clutter — the two serve different purposes (daily habit tracking vs. calendar/commitments) and should not share a list view.

---

## 2. Screen Layout Specification

### 2.1 Global structure (applies to every screen)

```
┌─────────────────────────────────────┐
│  Gati                          [PIN] │  ← header: app name left, session/PIN indicator right
├─────────────────────────────────────┤
│   [ Checklist ]     [ Schedule ]     │  ← primary filter, segmented control, always visible
├─────────────────────────────────────┤
│         (sub-nav, varies by section)│
├─────────────────────────────────────┤
│                                       │
│         (screen content)             │
│                                       │
└─────────────────────────────────────┘
```

The **Checklist / Schedule** segmented control is the top-level context switch. It sits directly below the header, on every screen, always visible, so switching context never requires going "back."

### 2.2 Checklist section (Phase 1 — unchanged, do not modify)

Sub-nav: `Today | History | Manage` — exactly as already built. Progress summary (e.g. "15 items · 3 done") stays directly below this sub-nav, above the list, as already implemented.

### 2.3 Schedule section (new)

Sub-nav: `Day | Week | Month | Manage`. **Day is the default view** when Schedule is selected (this answers "what do I have today," the most common question).

#### Day view
```
┌─────────────────────────────────────┐
│  ◀   Wed, 06/08/2026        ▶        │  ← date nav, DD/MM/YYYY, tap date to open picker
├─────────────────────────────────────┤
│ ▍ 09:00  Data Structures  (class)    │  ← single time-sorted list, mixing classes + tasks
│ ▍ 11:00  Submit assignment X (task)  │
│ ▍ 14:00  Algorithms  (class)         │
│ ▍ 18:00  Meet Rohan  (task)          │
└─────────────────────────────────────┘
```
- One **single timeline, sorted by time** — do not split classes and tasks into separate lists. The point of Day view is "what's on today," in chronological order.
- Visual distinction between the two types via a **left border color only** (see theme tokens below) — no separate icons needed unless trivial to add, but color-coding is required so the eye can tell class vs. task at a glance.
- Tasks with no specific time (just a due date) sort to the top of the day, before timed items.
- Tapping any item opens its detail (edit for tasks, read-only info for classes — link to Manage to edit classes).

#### Week view
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │  ← 7-column grid on desktop;
│04/08│05/08│06/08│07/08│08/08│09/08│10/08│    horizontally scrollable day-chips on mobile
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ DS  │     │ DS  │     │ DS  │     │     │  ← compact: class name/time chips stacked
│ Algo│ Algo│     │ Algo│     │     │     │
│ •   │     │ •   │     │ • • │     │     │  ← small dots below = task count that day
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```
- Dates in DD/MM under each day label.
- Tapping any day column jumps to Day view for that date.
- Keep each day cell compact — 2-3 class chips max visible, "+N more" if overflow, task dots (not full task names) to avoid clutter.

#### Month view
- Reuses the same calendar grid component as Checklist > History, but tile content differs: **no class info shown** (classes repeat weekly and would make every tile identical — not useful information at month scale). Only show a small dot/badge if one or more tasks are due that date.
- Do NOT overlay this on top of the Checklist consistency calendar or reuse its 70%-marker logic — this is a separate calendar instance scoped to Schedule > Month only.
- Tapping a date opens Day view for that date.

#### Manage (Schedule)
Two clearly separated sub-sections (tabs or a toggle within Manage):
- **Classes**: add/edit/archive a recurring class — fields: name, day(s) of week, time, optional room/link, optional notes
- **Tasks**: add/edit/archive a one-off task/deadline — fields: title, date, optional time, category (assignment / meeting / other), optional notes

---

## 3. Design Theme (Final — Flat "Ledger Calm")

Base palette is Ledger Calm, but **flat and natural — no gradients, no glassmorphism, no glow/ring effects, no translucent opacity washes.** Solid fills and solid borders only. Should look grounded and print-like.

### 3.1 Tailwind tokens

```css
--background: #F8FAFC;      /* surface */
--foreground: #0F172A;      /* ink */
--card: #FFFFFF;            /* flat white card, solid border below */
--border: #E2E8F0;          /* paper/border */
--muted: #94A3B8;           /* slate — secondary text */
--primary: #38BDF8;         /* signal blue — classes, links, active states */
--success: #22C55E;         /* checklist 70%+ marker, completed states */
--accent-task: #F59E0B;     /* amber — tasks/deadlines, distinct from class blue */
```

### 3.2 Fonts

- Headings: `Source Serif 4`
- UI/body: `Inter`
- Dates, labels, timestamps: `JetBrains Mono`

### 3.3 Component-specific rules

- **Checklist calendar tile, 70%+ day**: solid `--success` colored left border (3-4px), no fill gradient. Optional small flat checkmark badge, solid fill, top-right corner of tile — no glow/shadow on the badge.
- **Checklist calendar tile, below 70% but logged**: solid `--border` outline only, no color fill.
- **Checklist calendar tile, unlogged**: `--background`, no border emphasis — stays visually quiet.
- **Day view timeline items**: solid left border, 3-4px — `--primary` (blue) for classes, `--accent-task` (amber) for tasks. No background tint on the row itself, keep it flat white/`--card`.
- **Week view task dots**: solid filled circle, `--accent-task` color, no ring/glow.
- **Buttons, cards, inputs**: solid fills and solid 1px borders only, standard shadcn/ui components with default (not elevated/glassy) styling. Avoid `backdrop-blur`, `bg-opacity`, or gradient utility classes anywhere in the app.

If any part of the existing Phase 1 build currently uses gradients, glows, or translucent effects, flag it during Phase 2 rather than silently changing it — note it in the completion report (Section 6) so it can be reviewed.

---

## 4. Data Model Additions

**ClassSchedule**
- `id`
- `name`
- `day_of_week` (0-6, or enum Mon-Sun)
- `start_time`
- `end_time` (optional)
- `room_or_link` (optional)
- `notes` (optional)
- `archived_at` (nullable — soft delete, same pattern as checklist items)

**Task**
- `id`
- `title`
- `due_date` (ISO `YYYY-MM-DD`)
- `due_time` (optional)
- `category` (enum: assignment / meeting / other)
- `notes` (optional)
- `completed` (boolean — for marking a task done, separate from checklist completion)
- `archived_at` (nullable)

Both tables live in the same Postgres database as Phase 1 (checklist_items, daily_entries) — same backend, same PIN auth, no new auth system.

---

## 5. Milestones

**Milestone A — Data + API**
- ClassSchedule and Task tables + CRUD endpoints
- Manage (Schedule) screens: add/edit/archive for both Classes and Tasks

**Milestone B — Day View**
- Single time-sorted timeline mixing classes + tasks for a given date
- Date navigation (prev/next arrows + date picker), DD/MM/YYYY format
- Color-coded left borders per theme spec

**Milestone C — Week View**
- 7-column grid (desktop) / scrollable day-chips (mobile)
- Compact class chips + task dot indicators per day
- Tap-through to Day view

**Milestone D — Month View**
- Separate calendar instance (not reusing Checklist's consistency calendar logic)
- Task-only dot indicators per date, no class info
- Tap-through to Day view

**Verification checklist (all milestones):**
- [ ] Checklist / Schedule segmented control switches context without losing place in either section
- [ ] Day view defaults on entering Schedule
- [ ] Classes and tasks appear correctly color-coded and time-sorted in Day view
- [ ] Week view shows correct class chips + task counts per day, no name overflow breaking layout
- [ ] Month view shows task dots only, no class clutter
- [ ] All dates display DD/MM/YYYY throughout
- [ ] No gradients, glows, or translucent effects anywhere (spot-check against Section 3.3)
- [ ] Manage (Schedule) correctly separates Classes and Tasks as distinct add/edit flows

---

## 6. Completion Report — How to Report Back

Once **both Phase 1 and Phase 2** are complete (or if reporting Phase 1 separately first), produce a single report using this exact structure so it can be reviewed quickly without re-exploring the codebase:

```markdown
# Gati Build Report

## Phase 1 status
- Milestone A (Backend + PIN + Checklist CRUD): [pass/fail/partial] — notes
- Milestone B (Daily logging + history): [pass/fail/partial] — notes
- Milestone C (Consistency calendar): [pass/fail/partial] — notes
- Milestone D (PWA + push): [pass/fail/partial] — notes

## Phase 2 status
- Milestone A (Data + API for Classes/Tasks): [pass/fail/partial] — notes
- Milestone B (Day view): [pass/fail/partial] — notes
- Milestone C (Week view): [pass/fail/partial] — notes
- Milestone D (Month view): [pass/fail/partial] — notes

## Deviations from spec
List anything built differently than specified, and why (e.g. a library limitation, a simpler alternative chosen). Be specific — file/component names help.

## Known issues / not yet working
List anything incomplete or broken, however minor.

## Theme compliance
Confirm: no gradients/glows/translucent effects used anywhere, or flag exceptions with location.

## Deployed URLs
- Frontend:
- Backend:

## Anything else worth flagging
Open-ended — surprises, suggestions, things that were harder/easier than expected.
```

Paste this report back to Claude once ready — that's what's needed to review the build and plan next steps (Phase 3: recurring class schedule already lands in this phase, so Phase 3 will likely just be refinement/combined views rather than new content types).
