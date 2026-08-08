import { useMemo, useState } from "react";
import { CalendarPanel } from "./calendar-panel";
import { ChecklistPanel } from "./checklist-panel";
import { ManagePanel } from "./manage-panel";
import { Badge, Button, Card } from "./ui";
import { isBefore, todayDateString, toLocalDateString } from "../lib/date";
import { useAppReady, useChecklistItems, useDailyEntries } from "../lib/queries";

type ChecklistTab = "today" | "history" | "manage";

export function ChecklistSection({ visible = true }: { visible?: boolean }) {
  const ready = useAppReady();
  const items = useChecklistItems();
  const entries = useDailyEntries();
  const [tab, setTab] = useState<ChecklistTab>("today");

  const today = todayDateString();
  const visibleTodayItems = useMemo(
    () =>
      items.filter((item) => {
        const createdOn = toLocalDateString(item.createdAt);
        if (isBefore(today, createdOn)) {
          return false;
        }
        if (!item.archivedAt) {
          return true;
        }
        return isBefore(today, toLocalDateString(item.archivedAt));
      }),
    [items, today],
  );

  return (
    <section style={{ display: visible ? "grid" : "none" }} className="gap-4">
      {!ready ? (
        <div className="flex min-h-[50vh] items-center justify-center p-6 text-center">
          <div>
            <div className="font-mono text-sm uppercase tracking-[0.3em] text-muted">Gati</div>
            <div className="mt-3 text-2xl font-semibold">Booting local data...</div>
          </div>
        </div>
      ) : (
        <>
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  Checklist
                </div>
                <h2 className="mt-1 text-xl font-semibold">Daily habits</h2>
              </div>
              <Badge tone="muted">
                {items.length} items - {entries.length} entries
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["today", "Today"],
                ["history", "History"],
                ["manage", "Manage"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={tab === value ? "default" : "secondary"}
                  onClick={() => setTab(value as ChecklistTab)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </Card>

          {tab === "today" ? (
            <ChecklistPanel
              date={today}
              items={visibleTodayItems}
              entries={entries}
              title="Today"
              subtitle="Daily logging"
              compact
            />
          ) : null}

          {tab === "history" ? <CalendarPanel items={items} entries={entries} /> : null}

          {tab === "manage" ? <ManagePanel items={items} /> : null}
        </>
      )}
    </section>
  );
}
