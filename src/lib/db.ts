import Dexie, { type Table } from "dexie";
import { checklistSeeds } from "./seed";
import type { ChecklistItem, ClassSchedule, DailyEntry, Task } from "./types";
import { dateTimeString } from "./date";

class GatiDatabase extends Dexie {
  checklistItems!: Table<ChecklistItem, string>;
  dailyEntries!: Table<DailyEntry, string>;
  classSchedules!: Table<ClassSchedule, string>;
  tasks!: Table<Task, string>;

  constructor() {
    super("gati-phase1");
    this.version(1).stores({
      checklistItems: "id, sortOrder, createdAt, archivedAt",
      dailyEntries: "id, [date+itemId], date, itemId, loggedAt",
    });
    this.version(2).stores({
      checklistItems: "id, sortOrder, createdAt, archivedAt",
      dailyEntries: "id, [date+itemId], date, itemId, loggedAt",
      classSchedules: "id, dayOfWeek, startTime, archivedAt",
      tasks: "id, dueDate, dueTime, category, completed, archivedAt",
    });
  }
}

export const db = new GatiDatabase();

let seedPromise: Promise<void> | null = null;

export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      await db.open();
      const existingItems = await db.checklistItems.orderBy("sortOrder").toArray();
      const existingLabels = new Set(existingItems.map((item) => item.label));
      const nextSortOrder = existingItems.length
        ? Math.max(...existingItems.map((item) => item.sortOrder)) + 1
        : 0;

      const missingSeeds = checklistSeeds
        .filter((label) => !existingLabels.has(label))
        .map((label, index) => ({
          id: crypto.randomUUID(),
          label,
          createdAt: dateTimeString(),
          archivedAt: null,
          sortOrder: nextSortOrder + index,
        }));

      if (missingSeeds.length > 0) {
        await db.checklistItems.bulkAdd(missingSeeds);
      }
    })();
  }

  return seedPromise;
}
