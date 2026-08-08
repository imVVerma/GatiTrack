import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ChecklistItem,
  ClassSchedule,
  DailyEntry,
  Task,
} from "./types";
import {
  createChecklistItem,
  createClassSchedule,
  createTask,
  fetchBootstrap,
  importLocalData,
  loginWithPin,
  updateChecklistItem,
  updateClassSchedule,
  updateTask,
  upsertDailyEntry,
} from "./api";
import { readLocalMigrationPayload } from "./local-migration";

type AuthStatus = "loading" | "signed-out" | "signed-in";

type AppStore = {
  authStatus: AuthStatus;
  authError: string | null;
  token: string | null;
  login: (pin: string) => Promise<void>;
  logout: () => void;
  ready: boolean;
  loadingData: boolean;
  dataError: string | null;
  checklistItems: ChecklistItem[];
  dailyEntries: DailyEntry[];
  classSchedules: ClassSchedule[];
  tasks: Task[];
  refresh: () => Promise<void>;
  addChecklistItem: (label: string) => Promise<void>;
  renameChecklistItem: (id: string, label: string) => Promise<void>;
  archiveChecklistItem: (id: string) => Promise<void>;
  reorderChecklistItem: (id: string, sortOrder: number) => Promise<void>;
  saveDailyEntry: (entry: DailyEntry & { id?: string }) => Promise<void>;
  addClassSchedule: (payload: Omit<ClassSchedule, "id" | "archivedAt">) => Promise<void>;
  updateClassSchedule: (id: string, payload: Partial<ClassSchedule>) => Promise<void>;
  archiveClassSchedule: (id: string) => Promise<void>;
  addTask: (payload: Omit<Task, "id" | "archivedAt">) => Promise<void>;
  updateTask: (id: string, payload: Partial<Task>) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  toggleTaskComplete: (task: Task) => Promise<void>;
};

const AppStoreContext = createContext<AppStore | null>(null);

const TOKEN_KEY = "gati_session_token";
const MIGRATION_KEY = "gati_local_migrated";

export function AppProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      setAuthStatus("signed-in");
    } else {
      setAuthStatus("signed-out");
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoadingData(true);
    setDataError(null);
    try {
      const bootstrap = await fetchBootstrap(token);
      setChecklistItems(bootstrap.checklistItems);
      setDailyEntries(bootstrap.dailyEntries);
      setClassSchedules(bootstrap.classSchedules);
      setTasks(bootstrap.tasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load data";
      setDataError(message);
      if (message.includes("401")) {
        logout();
      }
    } finally {
      setLoadingData(false);
    }
  }, [token]);

  const runMigrationIfNeeded = useCallback(async () => {
    if (!token || window.localStorage.getItem(MIGRATION_KEY) === "1") {
      return;
    }

    const payload = await readLocalMigrationPayload();
    const hasLocalData =
      payload.checklistItems.length > 0 ||
      payload.dailyEntries.length > 0 ||
      payload.classSchedules.length > 0 ||
      payload.tasks.length > 0;

    if (!hasLocalData) {
      window.localStorage.setItem(MIGRATION_KEY, "1");
      return;
    }

    await importLocalData(token, payload);
    window.localStorage.setItem(MIGRATION_KEY, "1");
  }, [token]);

  useEffect(() => {
    if (!token) {
      setChecklistItems([]);
      setDailyEntries([]);
      setClassSchedules([]);
      setTasks([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingData(true);
      setDataError(null);
      try {
        await runMigrationIfNeeded();
        if (cancelled) {
          return;
        }
        const bootstrap = await fetchBootstrap(token);
        if (cancelled) {
          return;
        }
        setChecklistItems(bootstrap.checklistItems);
        setDailyEntries(bootstrap.dailyEntries);
        setClassSchedules(bootstrap.classSchedules);
        setTasks(bootstrap.tasks);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load data";
        setDataError(message);
        if (message.includes("401")) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runMigrationIfNeeded, token]);

  const login = useCallback(async (pin: string) => {
    setAuthError(null);
    try {
      const nextToken = await loginWithPin(pin);
      setToken(nextToken);
      setAuthStatus("signed-in");
      window.localStorage.setItem(TOKEN_KEY, nextToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate";
      setAuthError(message);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthStatus("signed-out");
    setChecklistItems([]);
    setDailyEntries([]);
    setClassSchedules([]);
    setTasks([]);
  }, []);

  const addChecklistItem = useCallback(
    async (label: string) => {
      if (!token) return;
      await createChecklistItem(token, {
        label,
        sortOrder: checklistItems.length ? Math.max(...checklistItems.map((item) => item.sortOrder)) + 1 : 0,
      });
      await refresh();
    },
    [checklistItems, refresh, token],
  );

  const renameChecklistItem = useCallback(
    async (id: string, label: string) => {
      if (!token) return;
      await updateChecklistItem(token, id, { label });
      await refresh();
    },
    [refresh, token],
  );

  const archiveChecklistItem = useCallback(
    async (id: string) => {
      if (!token) return;
      await updateChecklistItem(token, id, { archivedAt: new Date().toISOString() });
      await refresh();
    },
    [refresh, token],
  );

  const reorderChecklistItem = useCallback(
    async (id: string, sortOrder: number) => {
      if (!token) return;
      await updateChecklistItem(token, id, { sortOrder });
      await refresh();
    },
    [refresh, token],
  );

  const saveDailyEntry = useCallback(
    async (entry: DailyEntry & { id?: string }) => {
      if (!token) return;
      await upsertDailyEntry(token, entry);
      await refresh();
    },
    [refresh, token],
  );

  const addClassSchedule = useCallback(
    async (payload: Omit<ClassSchedule, "id" | "archivedAt">) => {
      if (!token) return;
      await createClassSchedule(token, payload);
      await refresh();
    },
    [refresh, token],
  );

  const updateClassScheduleAction = useCallback(
    async (id: string, payload: Partial<ClassSchedule>) => {
      if (!token) return;
      await updateClassSchedule(token, id, payload);
      await refresh();
    },
    [refresh, token],
  );

  const archiveClassSchedule = useCallback(
    async (id: string) => {
      if (!token) return;
      await updateClassSchedule(token, id, { archivedAt: new Date().toISOString() });
      await refresh();
    },
    [refresh, token],
  );

  const addTask = useCallback(
    async (payload: Omit<Task, "id" | "archivedAt">) => {
      if (!token) return;
      await createTask(token, payload);
      await refresh();
    },
    [refresh, token],
  );

  const updateTaskAction = useCallback(
    async (id: string, payload: Partial<Task>) => {
      if (!token) return;
      await updateTask(token, id, payload);
      await refresh();
    },
    [refresh, token],
  );

  const archiveTask = useCallback(
    async (id: string) => {
      if (!token) return;
      await updateTask(token, id, { archivedAt: new Date().toISOString() });
      await refresh();
    },
    [refresh, token],
  );

  const toggleTaskComplete = useCallback(
    async (task: Task) => {
      if (!token) return;
      await updateTask(token, task.id, { completed: !task.completed });
      await refresh();
    },
    [refresh, token],
  );

  const value = useMemo<AppStore>(
    () => ({
      authStatus,
      authError,
      token,
      login,
      logout,
      ready: authStatus !== "loading" && !loadingData,
      loadingData,
      dataError,
      checklistItems,
      dailyEntries,
      classSchedules,
      tasks,
      refresh,
      addChecklistItem,
      renameChecklistItem,
      archiveChecklistItem,
      reorderChecklistItem,
      saveDailyEntry,
      addClassSchedule,
      updateClassSchedule: updateClassScheduleAction,
      archiveClassSchedule,
      addTask,
      updateTask: updateTaskAction,
      archiveTask,
      toggleTaskComplete,
    }),
    [
      addChecklistItem,
      addClassSchedule,
      addTask,
      archiveChecklistItem,
      archiveClassSchedule,
      archiveTask,
      authError,
      authStatus,
      checklistItems,
      classSchedules,
      dailyEntries,
      dataError,
      loadingData,
      login,
      logout,
      refresh,
      reorderChecklistItem,
      renameChecklistItem,
      saveDailyEntry,
      tasks,
      token,
      toggleTaskComplete,
      updateClassScheduleAction,
      updateTaskAction,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppProvider");
  }
  return context;
}

