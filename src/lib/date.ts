export const GOOD_DAY_THRESHOLD = 0.7;

export function todayDateString(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB").format(new Date(year, month - 1, day));
}

export function formatDisplayDateTime(dateString: string, timeString: string | null) {
  if (!timeString) {
    return formatDisplayDate(dateString);
  }
  return `${formatDisplayDate(dateString)} ${timeString}`;
}

export function weekdayLabel(dayOfWeek: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek] ?? "";
}

export function weekdayIndex(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function toLocalDateString(value: string | number | Date) {
  return todayDateString(new Date(value));
}

export function dateTimeString() {
  return new Date().toISOString();
}

export function compareDateStrings(left: string, right: string) {
  return left.localeCompare(right);
}

export function startOfMonth(dateString: string) {
  const [year, month] = dateString.split("-").map(Number);
  return `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

export function addMonths(dateString: string, offset: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + offset);
  return toLocalDateString(date);
}

export function monthLabel(dateString: string) {
  const [year, month] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function daysInMonth(dateString: string) {
  const [year, month] = dateString.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function monthGrid(dateString: string) {
  const [year, month] = dateString.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const startPadding = (firstDay.getDay() + 6) % 7;
  const totalDays = daysInMonth(dateString);
  const cells: Array<string | null> = [];

  for (let index = 0; index < startPadding; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(
      `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function startOfWeek(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return todayDateString(date);
}

export function weekDates(dateString: string) {
  const start = startOfWeek(dateString);
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(date);
    next.setDate(date.getDate() + index);
    return todayDateString(next);
  });
}

export function addDays(dateString: string, offset: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return todayDateString(date);
}

export function isSameOrAfter(leftDate: string, rightDate: string) {
  return compareDateStrings(leftDate, rightDate) >= 0;
}

export function isBefore(leftDate: string, rightDate: string) {
  return compareDateStrings(leftDate, rightDate) < 0;
}
