import { useMemo, useState } from "react";
import { formatDisplayDate, toLocalDateString } from "../lib/date";
import type { ChecklistItem, DailyEntry } from "../lib/types";
import { useChecklistActions } from "../lib/queries";
import { Badge, Card, Divider } from "./ui";

function makeEntryMap(entries: DailyEntry[], date: string) {
  const map = new Map<string, DailyEntry>();
  for (const entry of entries) {
    if (entry.date === date) {
      map.set(entry.itemId, entry);
    }
  }
  return map;
}

export function ChecklistPanel({
  date,
  items,
  entries,
  title,
  subtitle,
  compact = false,
}: {
  date: string;
  items: ChecklistItem[];
  entries: DailyEntry[];
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const { saveDailyEntry } = useChecklistActions();
  const entriesForDate = useMemo(() => makeEntryMap(entries, date), [entries, date]);
  const orderedItems = useMemo(() => {
    if (!compact) {
      return items;
    }

    return [...items].sort((left, right) => {
      const leftCompleted = entriesForDate.get(left.id)?.completed ?? false;
      const rightCompleted = entriesForDate.get(right.id)?.completed ?? false;
      if (leftCompleted !== rightCompleted) {
        return leftCompleted ? 1 : -1;
      }
      return left.sortOrder - right.sortOrder;
    });
  }, [compact, entriesForDate, items]);
  const total = items.length;
  const completed = items.filter((item) => entriesForDate.get(item.id)?.completed).length;
  const isLogged = items.some((item) => entriesForDate.has(item.id));

  async function toggle(item: ChecklistItem, completedValue: boolean) {
    setSaving(item.id);
    try {
      await saveDailyEntry({
        id: entriesForDate.get(item.id)?.id,
        date,
        itemId: item.id,
        completed: completedValue,
        loggedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{subtitle}</div>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        <Badge tone={total > 0 && completed === total ? "good" : total === 0 ? "muted" : "neutral"}>
          {isLogged ? `${completed}/${total} complete` : "Not logged yet"}
        </Badge>
      </div>

      <Divider />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-background px-4 py-8 text-sm text-muted">
          Nothing exists for this date.
        </div>
      ) : (
        <div className={compact ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
          {orderedItems.map((item) => {
            const checked = entriesForDate.get(item.id)?.completed ?? false;
            const completedState = checked;
            return (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 transition hover:bg-slate-50 ${
                  compact
                    ? completedState
                      ? "border-line text-muted opacity-70"
                      : "border-line"
                    : "border-line"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`truncate text-sm font-medium ${
                        compact && completedState ? "text-muted" : "text-primary"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.archivedAt ? <Badge tone="muted">Archived</Badge> : null}
                  </div>
                  {compact ? null : (
                    <div className="mt-1 font-mono text-xs text-muted">
                      Created {formatDisplayDate(toLocalDateString(item.createdAt))}
                    </div>
                  )}
                </div>

                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => toggle(item, event.target.checked)}
                  disabled={saving === item.id}
                  className="h-5 w-5 rounded border-line accent-primary"
                />
              </label>
            );
          })}
        </div>
      )}
    </Card>
  );
}
