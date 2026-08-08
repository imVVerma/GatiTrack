import { useMemo } from "react";
import { GOOD_DAY_THRESHOLD, isBefore, toLocalDateString, weekdayIndex } from "./date";
import type {
  ChecklistItem,
  ClassSchedule,
  DailyEntry,
  DaySummary,
  Task,
} from "./types";
import { useAppStore } from "./app-store";

export function useAppReady() {
  return useAppStore().ready;
}

export function useChecklistItems() {
  return useAppStore().checklistItems;
}

export function useDailyEntries() {
  return useAppStore().dailyEntries;
}

export function useClassSchedules() {
  return useAppStore().classSchedules;
}

export function useTasks() {
  return useAppStore().tasks;
}

export function useChecklistActions() {
  const store = useAppStore();
  return useMemo(
    () => ({
      addChecklistItem: store.addChecklistItem,
      renameChecklistItem: store.renameChecklistItem,
      archiveChecklistItem: store.archiveChecklistItem,
      reorderChecklistItem: store.reorderChecklistItem,
      saveDailyEntry: store.saveDailyEntry,
    }),
    [store],
  );
}

export function useScheduleActions() {
  const store = useAppStore();
  return useMemo(
    () => ({
      addClassSchedule: store.addClassSchedule,
      updateClassSchedule: store.updateClassSchedule,
      archiveClassSchedule: store.archiveClassSchedule,
      addTask: store.addTask,
      updateTask: store.updateTask,
      archiveTask: store.archiveTask,
      toggleTaskComplete: store.toggleTaskComplete,
    }),
    [store],
  );
}

export function useAuth() {
  const store = useAppStore();
  return useMemo(
    () => ({
      authStatus: store.authStatus,
      authError: store.authError,
      token: store.token,
      login: store.login,
      logout: store.logout,
      loadingData: store.loadingData,
      dataError: store.dataError,
      ready: store.ready,
    }),
    [store],
  );
}

export function getVisibleItemsForDate(items: ChecklistItem[], date: string) {
  return items.filter((item) => {
    const createdOn = toLocalDateString(item.createdAt);
    if (isBefore(date, createdOn)) {
      return false;
    }
    if (!item.archivedAt) {
      return true;
    }
    return isBefore(date, toLocalDateString(item.archivedAt));
  });
}

export function buildDateSummary(date: string, items: ChecklistItem[], entries: DailyEntry[]) {
  const visibleItems = getVisibleItemsForDate(items, date);
  const entryList = entries.filter(
    (entry) => entry.date === date && visibleItems.some((item) => item.id === entry.itemId),
  );
  const totalActiveItems = visibleItems.length;
  const completedCount = entryList.filter((entry) => entry.completed).length;
  const completionRate =
    entryList.length === 0 || totalActiveItems === 0 ? null : completedCount / totalActiveItems;

  return {
    date,
    totalActiveItems,
    completedCount,
    completionRate,
    entryCount: entryList.length,
    isLogged: entryList.length > 0,
    isGoodDay: completionRate !== null && completionRate >= GOOD_DAY_THRESHOLD,
  } satisfies DaySummary;
}

export function getClassesForDate(items: ClassSchedule[], date: string) {
  const day = weekdayIndex(date);
  return items.filter((item) => item.dayOfWeek === day && !item.archivedAt);
}

export function getTasksForDate(items: Task[], date: string) {
  return items.filter((item) => item.dueDate === date && !item.archivedAt);
}
