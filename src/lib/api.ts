import type {
  ChecklistItem,
  ClassSchedule,
  DailyEntry,
  Task,
  TaskCategory,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://gatitrack.onrender.com";

export type ImportPayload = {
  checklistItems: Array<{
    id?: string;
    label: string;
    created_at?: string | null;
    archived_at?: string | null;
    sort_order: number;
  }>;
  dailyEntries: Array<{
    id?: string;
    date: string;
    item_id: string;
    completed: boolean;
    logged_at?: string | null;
  }>;
  classSchedules: Array<{
    id?: string;
    name: string;
    day_of_week: number;
    start_time: string;
    end_time?: string | null;
    room_or_link?: string | null;
    notes?: string | null;
    archived_at?: string | null;
  }>;
  tasks: Array<{
    id?: string;
    title: string;
    due_date: string;
    due_time?: string | null;
    category: TaskCategory;
    notes?: string | null;
    completed: boolean;
    archived_at?: string | null;
  }>;
};

export type BootstrapResponse = {
  checklistItems: ChecklistItem[];
  dailyEntries: DailyEntry[];
  classSchedules: ClassSchedule[];
  tasks: Task[];
};

async function requestJson<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function loginWithPin(pin: string) {
  const response = await fetch(`${API_BASE}/auth/pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || response.statusText);
  }

  const payload = (await response.json()) as { token: string };
  return payload.token;
}

export async function fetchBootstrap(token: string) {
  return requestJson<BootstrapResponse>("/bootstrap", token);
}

export async function importLocalData(token: string, payload: ImportPayload) {
  return requestJson<BootstrapResponse>("/admin/import", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createChecklistItem(token: string, payload: Partial<ChecklistItem> & { label: string; sortOrder: number }) {
  return requestJson<ChecklistItem>("/checklist-items", token, {
    method: "POST",
    body: JSON.stringify({
      id: payload.id,
      label: payload.label,
      created_at: payload.createdAt,
      archived_at: payload.archivedAt,
      sort_order: payload.sortOrder,
    }),
  });
}

export async function updateChecklistItem(
  token: string,
  id: string,
  payload: Partial<ChecklistItem>,
) {
  return requestJson<ChecklistItem>(`/checklist-items/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      label: payload.label,
      archived_at: payload.archivedAt,
      sort_order: payload.sortOrder,
    }),
  });
}

export async function upsertDailyEntry(
  token: string,
  payload: DailyEntry & { id?: string },
) {
  const body = {
    id: payload.id,
    date: payload.date,
    item_id: payload.itemId,
    completed: payload.completed,
    logged_at: payload.loggedAt,
  };
  const route = payload.id ? `/daily-entries/${payload.id}` : "/daily-entries";
  return requestJson<DailyEntry>(route, token, {
    method: payload.id ? "PUT" : "POST",
    body: JSON.stringify(body),
  });
}

export async function createClassSchedule(token: string, payload: Partial<ClassSchedule> & { name: string; dayOfWeek: number; startTime: string }) {
  return requestJson<ClassSchedule>("/class-schedules", token, {
    method: "POST",
    body: JSON.stringify({
      id: payload.id,
      name: payload.name,
      day_of_week: payload.dayOfWeek,
      start_time: payload.startTime,
      end_time: payload.endTime,
      room_or_link: payload.roomOrLink,
      notes: payload.notes,
      archived_at: payload.archivedAt,
    }),
  });
}

export async function updateClassSchedule(token: string, id: string, payload: Partial<ClassSchedule>) {
  return requestJson<ClassSchedule>(`/class-schedules/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      name: payload.name,
      day_of_week: payload.dayOfWeek,
      start_time: payload.startTime,
      end_time: payload.endTime,
      room_or_link: payload.roomOrLink,
      notes: payload.notes,
      archived_at: payload.archivedAt,
    }),
  });
}

export async function createTask(token: string, payload: Partial<Task> & { title: string; dueDate: string; category: TaskCategory }) {
  return requestJson<Task>("/tasks", token, {
    method: "POST",
    body: JSON.stringify({
      id: payload.id,
      title: payload.title,
      due_date: payload.dueDate,
      due_time: payload.dueTime,
      category: payload.category,
      notes: payload.notes,
      completed: payload.completed ?? false,
      archived_at: payload.archivedAt,
    }),
  });
}

export async function updateTask(token: string, id: string, payload: Partial<Task>) {
  return requestJson<Task>(`/tasks/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      title: payload.title,
      due_date: payload.dueDate,
      due_time: payload.dueTime,
      category: payload.category,
      notes: payload.notes,
      completed: payload.completed,
      archived_at: payload.archivedAt,
    }),
  });
}
