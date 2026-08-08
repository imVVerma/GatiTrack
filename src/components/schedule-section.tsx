import { useMemo, useState } from "react";
import {
  addDays,
  formatDisplayDate,
  monthGrid,
  monthLabel,
  startOfWeek,
  todayDateString,
  weekdayLabel,
  weekDates,
  weekdayIndex,
} from "../lib/date";
import { Badge, Button, Card, Input } from "./ui";
import { Modal } from "./modal";
import {
  getClassesForDate,
  getTasksForDate,
  useClassSchedules,
  useScheduleActions,
  useTasks,
} from "../lib/queries";
import type { ClassSchedule, Task, TaskCategory } from "../lib/types";

type ScheduleTab = "day" | "week" | "month" | "manage";

function timeSortValue(value: string | null) {
  if (!value) {
    return -1;
  }
  return Number(value.replace(":", ""));
}

function taskCategoryLabel(category: TaskCategory) {
  if (category === "assignment") {
    return "Assignment";
  }
  if (category === "meeting") {
    return "Meeting";
  }
  return "Other";
}

function classChipText(item: ClassSchedule) {
  return `${item.name} ${item.startTime}`;
}

function scheduleItemsForDate(classes: ClassSchedule[], tasks: Task[], date: string) {
  const dayClasses = getClassesForDate(classes, date).map((item) => ({
    kind: "class" as const,
    sort: timeSortValue(item.startTime),
    startTime: item.startTime,
    title: item.name,
    item,
  }));

  const dayTasks = getTasksForDate(tasks, date).map((item) => ({
    kind: "task" as const,
    sort: timeSortValue(item.dueTime),
    startTime: item.dueTime,
    title: item.title,
    item,
  }));

  return [...dayTasks, ...dayClasses].sort((left, right) => {
    if (left.sort !== right.sort) {
      return left.sort - right.sort;
    }
    if (left.kind !== right.kind) {
      return left.kind === "task" ? -1 : 1;
    }
    return left.title.localeCompare(right.title);
  });
}

function dayLabel(date: string) {
  return `${weekdayLabel(weekdayIndex(date))}, ${formatDisplayDate(date)}`;
}

function ClassForm({
  value,
  onChange,
  onSubmit,
  onClear,
  submitLabel,
}: {
  value: {
    name: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomOrLink: string;
    notes: string;
  };
  onChange: (next: {
    name: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomOrLink: string;
    notes: string;
  }) => void;
  onSubmit: () => void;
  onClear: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3">
      <Input
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        placeholder="Class name"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Day</span>
          <select
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-primary"
            value={value.dayOfWeek}
            onChange={(event) => onChange({ ...value, dayOfWeek: Number(event.target.value) })}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Start</span>
          <Input
            type="time"
            value={value.startTime}
            onChange={(event) => onChange({ ...value, startTime: event.target.value })}
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          value={value.endTime}
          onChange={(event) => onChange({ ...value, endTime: event.target.value })}
          placeholder="End time (optional)"
        />
        <Input
          value={value.roomOrLink}
          onChange={(event) => onChange({ ...value, roomOrLink: event.target.value })}
          placeholder="Room or link"
        />
      </div>
      <Input
        value={value.notes}
        onChange={(event) => onChange({ ...value, notes: event.target.value })}
        placeholder="Notes"
      />
      <div className="flex gap-2">
        <Button onClick={onSubmit}>{submitLabel}</Button>
        <Button variant="secondary" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

function TaskForm({
  value,
  onChange,
  onSubmit,
  onClear,
  submitLabel,
}: {
  value: {
    title: string;
    dueDate: string;
    dueTime: string;
    category: TaskCategory;
    notes: string;
  };
  onChange: (next: {
    title: string;
    dueDate: string;
    dueTime: string;
    category: TaskCategory;
    notes: string;
  }) => void;
  onSubmit: () => void;
  onClear: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3">
      <Input
        value={value.title}
        onChange={(event) => onChange({ ...value, title: event.target.value })}
        placeholder="Task title"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          type="date"
          value={value.dueDate}
          onChange={(event) => onChange({ ...value, dueDate: event.target.value })}
        />
        <Input
          type="time"
          value={value.dueTime}
          onChange={(event) => onChange({ ...value, dueTime: event.target.value })}
          placeholder="Time optional"
        />
      </div>
      <label className="space-y-1 text-sm">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Category</span>
        <select
          className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-primary"
          value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value as TaskCategory })}
        >
          <option value="assignment">Assignment</option>
          <option value="meeting">Meeting</option>
          <option value="other">Other</option>
        </select>
      </label>
      <Input
        value={value.notes}
        onChange={(event) => onChange({ ...value, notes: event.target.value })}
        placeholder="Notes"
      />
      <div className="flex gap-2">
        <Button onClick={onSubmit}>{submitLabel}</Button>
        <Button variant="secondary" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export function ScheduleSection({ visible = true }: { visible?: boolean }) {
  const classes = useClassSchedules();
  const tasks = useTasks();
  const {
    addClassSchedule,
    updateClassSchedule,
    archiveClassSchedule,
    addTask,
    updateTask,
    archiveTask,
    toggleTaskComplete,
  } = useScheduleActions();
  const [tab, setTab] = useState<ScheduleTab>("day");
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [activeDetail, setActiveDetail] = useState<
    { kind: "class"; item: ClassSchedule } | { kind: "task"; item: Task } | null
  >(null);
  const [classDraft, setClassDraft] = useState({
    name: "",
    dayOfWeek: weekdayIndex(todayDateString()),
    startTime: "",
    endTime: "",
    roomOrLink: "",
    notes: "",
  });
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    dueDate: todayDateString(),
    dueTime: "",
    category: "assignment" as TaskCategory,
    notes: "",
  });
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const dayItems = useMemo(
    () => scheduleItemsForDate(classes, tasks, selectedDate),
    [classes, tasks, selectedDate],
  );

  const weekStart = startOfWeek(selectedDate);
  const weekDays = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const monthAnchor = `${selectedDate.slice(0, 7)}-01`;
  const monthCells = useMemo(() => monthGrid(monthAnchor), [monthAnchor]);

  const classDraftCount = classes.length;
  const taskDraftCount = tasks.length;

  function resetClassDraft() {
    setClassDraft({
      name: "",
      dayOfWeek: weekdayIndex(todayDateString()),
      startTime: "",
      endTime: "",
      roomOrLink: "",
      notes: "",
    });
    setEditingClassId(null);
  }

  function resetTaskDraft() {
    setTaskDraft({
      title: "",
      dueDate: todayDateString(),
      dueTime: "",
      category: "assignment",
      notes: "",
    });
    setEditingTaskId(null);
  }

  async function saveClass() {
    const payload = {
      name: classDraft.name.trim(),
      dayOfWeek: classDraft.dayOfWeek,
      startTime: classDraft.startTime,
      endTime: classDraft.endTime.trim() || null,
      roomOrLink: classDraft.roomOrLink.trim() || null,
      notes: classDraft.notes.trim() || null,
      archivedAt: null,
    };

    if (!payload.name || !payload.startTime) {
      return;
    }

    if (editingClassId) {
      await updateClassSchedule(editingClassId, payload);
    } else {
      await addClassSchedule({
        name: payload.name,
        dayOfWeek: payload.dayOfWeek,
        startTime: payload.startTime,
        endTime: payload.endTime,
        roomOrLink: payload.roomOrLink,
        notes: payload.notes,
      });
    }
    resetClassDraft();
  }

  async function saveTask() {
    const payload = {
      title: taskDraft.title.trim(),
      dueDate: taskDraft.dueDate,
      dueTime: taskDraft.dueTime.trim() || null,
      category: taskDraft.category,
      notes: taskDraft.notes.trim() || null,
      completed: false,
      archivedAt: null,
    };

    if (!payload.title || !payload.dueDate) {
      return;
    }

    if (editingTaskId) {
      await updateTask(editingTaskId, payload);
    } else {
      await addTask({
        title: payload.title,
        dueDate: payload.dueDate,
        dueTime: payload.dueTime,
        category: payload.category,
        notes: payload.notes,
        completed: payload.completed,
      });
    }
    resetTaskDraft();
  }

  async function archiveClass(id: string) {
    await archiveClassSchedule(id);
  }

  async function archiveTaskItem(id: string) {
    await archiveTask(id);
  }

  const monthTaskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (task.archivedAt) {
        continue;
      }
      counts.set(task.dueDate, (counts.get(task.dueDate) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const monthDatesWithTasks = useMemo(() => new Set(tasks.filter((task) => !task.archivedAt).map((task) => task.dueDate)), [tasks]);

  return (
    <section style={{ display: visible ? "grid" : "none" }} className="gap-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Schedule
            </div>
            <h2 className="mt-1 text-xl font-semibold">Classes and tasks</h2>
          </div>
          <Badge tone="muted">
            {classDraftCount} classes - {taskDraftCount} tasks
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["day", "Day"],
            ["week", "Week"],
            ["month", "Month"],
            ["manage", "Manage"],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={tab === value ? "default" : "secondary"}
              onClick={() => setTab(value as ScheduleTab)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {tab === "day" ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
              {"<"}
            </Button>
            <button
              type="button"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>("#schedule-day-picker");
                input?.showPicker?.();
                input?.click();
              }}
              className="rounded-2xl border border-line bg-card px-4 py-2 font-mono text-sm text-primary"
            >
              {dayLabel(selectedDate)}
            </button>
            <input
              id="schedule-day-picker"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="sr-only"
            />
            <Button variant="secondary" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              {">"}
            </Button>
          </div>

          <div className="space-y-2">
            {dayItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-background px-4 py-8 text-sm text-muted">
                Nothing scheduled for this day.
              </div>
            ) : (
              dayItems.map((entry) => (
                <div
                  key={`${entry.kind}-${entry.item.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: entry.kind === "class" ? "var(--accent)" : "var(--accent-task)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDetail(entry)}
                        className="truncate text-left text-sm font-medium text-primary"
                      >
                        {entry.title}
                      </button>
                      <Badge tone="muted">{entry.kind}</Badge>
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted">
                      {entry.startTime ? entry.startTime : "All day"}{" "}
                      {entry.kind === "task"
                        ? `- ${taskCategoryLabel(entry.item.category)}`
                        : entry.item.roomOrLink
                          ? `- ${entry.item.roomOrLink}`
                          : ""}
                    </div>
                  </div>
                  {entry.kind === "task" ? (
                    <input
                      type="checkbox"
                      checked={entry.item.completed}
                      onChange={() => void toggleTaskComplete(entry.item)}
                      className="h-5 w-5 rounded border-line accent-primary"
                    />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      {tab === "week" ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Week starting {formatDisplayDate(weekStart)}
            </div>
            <Button variant="secondary" onClick={() => setSelectedDate(todayDateString())}>
              Today
            </Button>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[56rem] grid-cols-7 gap-2">
              {weekDays.map((date) => {
                const classesForDay = getClassesForDate(classes, date);
                const tasksForDay = getTasksForDate(tasks, date);
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setTab("day");
                    }}
                    className="rounded-2xl border border-line bg-card p-3 text-left"
                  >
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                      {weekdayLabel(weekdayIndex(date))} {formatDisplayDate(date)}
                    </div>
                    <div className="mt-3 space-y-2">
                      {classesForDay.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="truncate rounded-xl border border-line bg-background px-2 py-1 font-mono text-xs text-primary"
                        >
                          {item.startTime} {item.name}
                        </div>
                      ))}
                      {classesForDay.length > 3 ? (
                        <div className="font-mono text-xs text-muted">
                          +{classesForDay.length - 3} more
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {Array.from({ length: Math.min(tasksForDay.length, 3) }).map((_, index) => (
                        <span
                          key={index}
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: "var(--accent-task)" }}
                        />
                      ))}
                      {tasksForDay.length > 3 ? (
                        <span className="font-mono text-xs text-muted">+{tasksForDay.length - 3}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      ) : null}

      {tab === "month" ? (
        <Card className="space-y-4">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Month tasks
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthCells.map((cell, index) => {
              if (!cell) {
                return <div key={`blank-${index}`} className="h-20 rounded-2xl border border-dashed border-line bg-background" />;
              }
              const count = monthTaskCounts.get(cell) ?? 0;
              const hasTasks = monthDatesWithTasks.has(cell);
              return (
                <button
                  key={cell}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell);
                    setTab("day");
                  }}
                  className="flex h-20 flex-col justify-between rounded-2xl border border-line bg-card p-3 text-left"
                >
                  <div className="font-mono text-sm text-primary">{cell.slice(8, 10)}</div>
                  <div className="flex justify-end">
                    {hasTasks ? (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: "var(--accent-task)" }}
                          aria-label={`${count} tasks`}
                        />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      {tab === "manage" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Classes</h3>
              <Badge tone="muted">{classes.filter((item) => !item.archivedAt).length} active</Badge>
            </div>
            <ClassForm
              value={classDraft}
              onChange={setClassDraft}
              onSubmit={() => void saveClass()}
              onClear={resetClassDraft}
              submitLabel={editingClassId ? "Update class" : "Add class"}
            />
            <div className="space-y-2">
              {classes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-line bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-primary">{item.name}</div>
                      <div className="font-mono text-xs text-muted">
                        {weekdayLabel(item.dayOfWeek)} - {item.startTime}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingClassId(item.id);
                          setClassDraft({
                            name: item.name,
                            dayOfWeek: item.dayOfWeek,
                            startTime: item.startTime,
                            endTime: item.endTime ?? "",
                            roomOrLink: item.roomOrLink ?? "",
                            notes: item.notes ?? "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => void archiveClass(item.id)} disabled={Boolean(item.archivedAt)}>
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Tasks</h3>
              <Badge tone="muted">{tasks.filter((item) => !item.archivedAt).length} active</Badge>
            </div>
            <TaskForm
              value={taskDraft}
              onChange={setTaskDraft}
              onSubmit={() => void saveTask()}
              onClear={resetTaskDraft}
              submitLabel={editingTaskId ? "Update task" : "Add task"}
            />
            <div className="space-y-2">
              {tasks.map((item) => (
                <div key={item.id} className="rounded-2xl border border-line bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-primary">{item.title}</div>
                      <div className="font-mono text-xs text-muted">
                        {formatDisplayDate(item.dueDate)}
                        {item.dueTime ? ` ${item.dueTime}` : ""}
                        {" - "}
                        {taskCategoryLabel(item.category)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingTaskId(item.id);
                          setTaskDraft({
                            title: item.title,
                            dueDate: item.dueDate,
                            dueTime: item.dueTime ?? "",
                            category: item.category,
                            notes: item.notes ?? "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => void archiveTaskItem(item.id)} disabled={Boolean(item.archivedAt)}>
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <Modal open={Boolean(activeDetail)} title="Schedule detail" onClose={() => setActiveDetail(null)}>
        {activeDetail?.kind === "class" ? (
          <div className="space-y-3">
            <div className="text-lg font-semibold">{activeDetail.item.name}</div>
            <div className="font-mono text-sm text-muted">
              {weekdayLabel(activeDetail.item.dayOfWeek)} - {activeDetail.item.startTime}
              {activeDetail.item.endTime ? ` to ${activeDetail.item.endTime}` : ""}
            </div>
            {activeDetail.item.roomOrLink ? (
              <div className="text-sm text-primary">{activeDetail.item.roomOrLink}</div>
            ) : null}
            {activeDetail.item.notes ? <div className="text-sm text-muted">{activeDetail.item.notes}</div> : null}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setTab("manage")}>Edit in Manage</Button>
            </div>
          </div>
        ) : activeDetail?.kind === "task" ? (
          <div className="space-y-3">
            <TaskForm
              value={{
                title: activeDetail.item.title,
                dueDate: activeDetail.item.dueDate,
                dueTime: activeDetail.item.dueTime ?? "",
                category: activeDetail.item.category,
                notes: activeDetail.item.notes ?? "",
              }}
              onChange={(next) => {
                setActiveDetail({
                  kind: "task",
                  item: { ...activeDetail.item, ...next, dueTime: next.dueTime || null, notes: next.notes || null },
                });
              }}
              onSubmit={async () => {
                await updateTask(activeDetail.item.id, {
                  title: activeDetail.item.title,
                  dueDate: activeDetail.item.dueDate,
                  dueTime: activeDetail.item.dueTime,
                  category: activeDetail.item.category,
                  notes: activeDetail.item.notes,
                  completed: activeDetail.item.completed,
                });
                setActiveDetail(null);
              }}
              onClear={() => setActiveDetail(null)}
              submitLabel="Save task"
            />
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
