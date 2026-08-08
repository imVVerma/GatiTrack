export interface ChecklistItem {
  id: string;
  label: string;
  createdAt: string;
  archivedAt: string | null;
  sortOrder: number;
}

export interface DailyEntry {
  id: string;
  date: string;
  itemId: string;
  completed: boolean;
  loggedAt: string;
}

export interface DaySummary {
  date: string;
  totalActiveItems: number;
  completedCount: number;
  completionRate: number | null;
  entryCount: number;
  isLogged: boolean;
  isGoodDay: boolean;
}

export interface ClassSchedule {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string | null;
  roomOrLink: string | null;
  notes: string | null;
  archivedAt: string | null;
}

export type TaskCategory = "assignment" | "meeting" | "other";

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string | null;
  category: TaskCategory;
  notes: string | null;
  completed: boolean;
  archivedAt: string | null;
}
