/**
 * Server-side Date & Scheduling Engine for Nuxt 3.
 * Pure UTC-based calculations avoiding timezone bugs.
 */

export const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export function getTodayDateString(timeZone = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export function isValidDateString(str: string): boolean {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false;
  }
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay();
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const newY = date.getUTCFullYear();
  const newM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const newD = String(date.getUTCDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
}

export function isClassDay(dateStr: string, classDays: number[] = [1, 2, 3, 4, 5]): boolean {
  const day = getDayOfWeek(dateStr);
  return classDays.includes(day);
}

export function getFirstClassDateOnOrAfter(dateStr: string, classDays: number[] = [1, 2, 3, 4, 5]): string {
  if (classDays.length === 0) return dateStr;
  let curr = dateStr;
  let safetyCounter = 0;
  while (!isClassDay(curr, classDays) && safetyCounter < 14) {
    curr = addDays(curr, 1);
    safetyCounter++;
  }
  return curr;
}

export function getNextClassDate(dateStr: string, classDays: number[] = [1, 2, 3, 4, 5]): string {
  if (classDays.length === 0) return addDays(dateStr, 1);
  let curr = addDays(dateStr, 1);
  let safetyCounter = 0;
  while (!isClassDay(curr, classDays) && safetyCounter < 14) {
    curr = addDays(curr, 1);
    safetyCounter++;
  }
  return curr;
}

export function formatDate(dateStr: string, { includeDayName = true, shortMonth = false } = {}): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayIndex = getDayOfWeek(dateStr);
  const dayName = INDONESIAN_DAYS[dayIndex];
  const monthName = shortMonth ? INDONESIAN_MONTHS_SHORT[m - 1] : INDONESIAN_MONTHS[m - 1];

  if (includeDayName) {
    return `${dayName}, ${d} ${monthName} ${y}`;
  }
  return `${d} ${monthName} ${y}`;
}

export function formatShortDate(dateStr: string, withDay = false): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const [, m, d] = dateStr.split('-').map(Number);
  const monthName = INDONESIAN_MONTHS_SHORT[m - 1];
  if (withDay) {
    const dayName = INDONESIAN_DAYS[getDayOfWeek(dateStr)];
    return `${dayName}, ${d} ${monthName}`;
  }
  return `${d} ${monthName}`;
}

export function getRelativeDateInfo(dateStr: string, todayStr = getTodayDateString()) {
  const diffDays = Math.round(
    (new Date(dateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dateStr === todayStr) {
    return { label: 'Hari Ini', isToday: true, isTomorrow: false, isPast: false };
  }
  if (diffDays === 1) {
    return { label: 'Besok', isToday: false, isTomorrow: true, isPast: false };
  }
  if (diffDays === -1) {
    return { label: 'Kemarin', isToday: false, isTomorrow: false, isPast: true };
  }
  return {
    label: formatShortDate(dateStr, true),
    isToday: false,
    isTomorrow: false,
    isPast: dateStr < todayStr
  };
}

export function recalculateDatesArray<T extends { date: string; status: string }>(
  scheduleItems: T[],
  classDays: number[] = [1, 2, 3, 4, 5],
  today = getTodayDateString()
): T[] {
  const historical: T[] = [];
  const active: T[] = [];

  let todayHasFinishedSession = false;

  for (const item of scheduleItems) {
    if (item.status === 'completed' || item.status === 'skipped') {
      historical.push(item);
      if (item.date === today) {
        todayHasFinishedSession = true;
      }
    } else {
      active.push(item);
    }
  }

  let nextDate: string;
  if (!todayHasFinishedSession && isClassDay(today, classDays)) {
    nextDate = today;
  } else {
    nextDate = getNextClassDate(today, classDays);
  }

  const recalculatedActive = active.map(item => {
    const assignedDate = nextDate;
    nextDate = getNextClassDate(nextDate, classDays);
    return {
      ...item,
      date: assignedDate
    };
  });

  return [...historical, ...recalculatedActive].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
