import { db } from "./db";

export async function readLocalMigrationPayload() {
  const [checklistItems, dailyEntries, classSchedules, tasks] = await Promise.all([
    db.checklistItems.orderBy("sortOrder").toArray(),
    db.dailyEntries.orderBy("[date+itemId]").toArray(),
    db.classSchedules.orderBy("dayOfWeek").toArray(),
    db.tasks.orderBy("dueDate").toArray(),
  ]);

  return {
    checklistItems: checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      created_at: item.createdAt,
      archived_at: item.archivedAt,
      sort_order: item.sortOrder,
    })),
    dailyEntries: dailyEntries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      item_id: entry.itemId,
      completed: entry.completed,
      logged_at: entry.loggedAt,
    })),
    classSchedules: classSchedules.map((item) => ({
      id: item.id,
      name: item.name,
      day_of_week: item.dayOfWeek,
      start_time: item.startTime,
      end_time: item.endTime,
      room_or_link: item.roomOrLink,
      notes: item.notes,
      archived_at: item.archivedAt,
    })),
    tasks: tasks.map((item) => ({
      id: item.id,
      title: item.title,
      due_date: item.dueDate,
      due_time: item.dueTime,
      category: item.category,
      notes: item.notes,
      completed: item.completed,
      archived_at: item.archivedAt,
    })),
  };
}
