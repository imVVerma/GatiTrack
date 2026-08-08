import { useMemo, useState } from "react";
import {
  addMonths,
  formatDisplayDate,
  monthGrid,
  monthLabel,
  todayDateString,
  toLocalDateString,
} from "../lib/date";
import { buildDateSummary } from "../lib/queries";
import type { ChecklistItem, DailyEntry } from "../lib/types";
import { Badge, Button, Card } from "./ui";
import { ChecklistPanel } from "./checklist-panel";

export function CalendarPanel({
  items,
  entries,
}: {
  items: ChecklistItem[];
  entries: DailyEntry[];
}) {
  const [monthAnchor, setMonthAnchor] = useState(todayDateString());
  const [selectedDate, setSelectedDate] = useState(todayDateString());

  const currentMonth = useMemo(() => `${monthAnchor.slice(0, 7)}-01`, [monthAnchor]);
  const cells = useMemo(() => monthGrid(currentMonth), [currentMonth]);
  const summaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildDateSummary>>();
    for (const cell of cells) {
      if (cell) {
        map.set(cell, buildDateSummary(cell, items, entries));
      }
    }
    return map;
  }, [cells, entries, items]);
  const selectedSummary = summaries.get(selectedDate) ?? buildDateSummary(selectedDate, items, entries);

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              History calendar
            </div>
            <h2 className="mt-1 text-xl font-semibold">{monthLabel(currentMonth)}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}>
              Prev
            </Button>
            <Button variant="secondary" onClick={() => setMonthAnchor(todayDateString())}>
              Today
            </Button>
            <Button variant="secondary" onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}>
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`blank-${index}`}
                  className="h-20 rounded-2xl border border-dashed border-line bg-background"
                />
              );
            }

            const summary = summaries.get(cell);
            const isSelected = cell === selectedDate;
            const hasEntries = summary?.isLogged ?? false;
            const isGoodDay = summary?.isGoodDay ?? false;
            const isToday = cell === todayDateString();
            const isLoggedBelowThreshold = hasEntries && !isGoodDay;

            return (
              <button
                key={cell}
                onClick={() => setSelectedDate(cell)}
                className={`group flex h-20 flex-col justify-between rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? "border-primary bg-card"
                    : isGoodDay
                      ? "border-success bg-card"
                      : isLoggedBelowThreshold
                        ? "border-line bg-card"
                        : "border-line bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-primary">{cell.slice(8, 10)}</span>
                  {isGoodDay ? (
                    <Badge tone="good">70%+</Badge>
                  ) : isToday ? (
                    <Badge tone="muted">Today</Badge>
                  ) : null}
                </div>
                <div className="font-mono text-[0.7rem] text-muted">
                  {!hasEntries
                    ? "Blank"
                    : isGoodDay
                      ? "Good"
                      : `${summary?.completedCount ?? 0}/${summary?.totalActiveItems ?? 0}`}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <ChecklistPanel
        date={selectedDate}
        items={items.filter((item) => {
          const createdOn = toLocalDateString(item.createdAt);
          if (selectedDate < createdOn) {
            return false;
          }
          if (!item.archivedAt) {
            return true;
          }
          return selectedDate < toLocalDateString(item.archivedAt);
        })}
        entries={entries}
        title={formatDisplayDate(selectedDate)}
        subtitle={`Selected date detail - ${selectedSummary.isLogged ? "logged" : "not logged yet"}`}
      />
    </div>
  );
}
