# Gati — Layout Fix Prompt (for Antigravity)

Two UI fixes to the existing build. No new features, no data model changes — this is purely layout/interaction polish on what's already built.

## 1. True tab switching between Checklist and Schedule

**Current behavior:** Clicking "Schedule" changes the selected filter's color, but both Checklist and Schedule content stay stacked on the page — the user has to scroll down manually to reach Schedule content, and Checklist content is still visible/mixed in above it.

**Required behavior:** Clicking `Checklist` or `Schedule` should show **only** that section's content — the other section should not be visible or take up scroll space at all. This should feel like standard tabs, not a same-page scroll anchor.

- It's fine to keep both sections mounted in the component tree (as already done, to preserve each section's internal state — e.g. which date is selected in History) — just hide the non-active one (e.g. `display: none` / conditional render of visibility) rather than relying on scroll position.
- No page reload or state loss when switching back and forth — if the user was on History > 15th, and switches to Schedule and back to Checklist, they should land back on History > 15th, not reset to Today.

## 2. Denser Today checklist layout

**Current behavior:** Each checklist item on the "Today" screen is a full-width row that includes the item's creation date — this wastes space and doesn't scale as more items get added.

**Required behavior:**
- Remove the creation date from the Today view entirely. Creation date is only relevant in `Manage` — keep it there if it's already shown there, otherwise no need to add it anywhere new.
- Replace the current row-based list with a **compact grid of checkbox + short label "chips"** — think small rounded rectangles/pills, each containing a checkbox and the item label, tightly packed in a multi-column grid (as many columns as comfortably fit the label lengths — likely 2-3 on mobile, 4-5+ on desktop). This should look and feel denser than a vertical list, since the point is to avoid scrolling as the list grows past 15 items.
- **Completed items get visually deprioritized**: apply a muted/grayed-out style (lower opacity or muted text/border color, consistent with the flat theme — no color removal tricks like strikethrough gradients, just a flat muted state) AND move completed items to the end of the grid, after all uncompleted items. Uncompleted items should always be the first thing visible, since those are what still need action.
- Reordering (completed items moving to the end) should happen smoothly, not jarringly — a brief transition is fine if trivial, but don't over-engineer animation here; correctness of final position matters more than motion polish.
- The progress summary above (e.g. "15 items · 3 done") stays as-is, unaffected by this change.

## Verification Checklist

- [ ] Clicking Schedule shows only Schedule content, no Checklist content visible or scrollable above/below it
- [ ] Clicking Checklist shows only Checklist content, same rule
- [ ] Switching tabs back and forth preserves each section's internal navigation state (e.g. selected date in History, selected view in Schedule)
- [ ] Today view no longer shows creation date per item
- [ ] Today view renders as a dense multi-column grid of checkbox chips, not a vertical list
- [ ] Checking an item off visually mutes it and moves it to the end of the grid
- [ ] Unchecking an item restores its normal appearance and moves it back among the uncompleted items
- [ ] Layout holds up reasonably with 15 items and doesn't visibly break if a few more are added (rough scale-check, no need for extreme stress testing)
- [ ] `npm run build` passes

## Report Back

Use the same report format already established (pass/fail per item above, deviations, known issues, deployed URL/build status).
