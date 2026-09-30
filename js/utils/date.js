/**
 * Pure date utility layer for the schedule tracker.
 * Operates strictly on ISO date strings (YYYY-MM-DD) to prevent timezone drift.
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

/**
 * Gets today's date in YYYY-MM-DD format using a specific timezone (Asia/Jakarta by default).
 * @param {string} [timeZone=DEFAULT_TIMEZONE]
 * @returns {string} ISO Date (YYYY-MM-DD)
 */
export function getTodayDateString(timeZone = DEFAULT_TIMEZONE) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if timezone not supported in current environment
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Validates if string matches YYYY-MM-DD format.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidDateString(str) {
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

/**
 * Returns the day of week for a YYYY-MM-DD string (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 * @param {string} dateStr
 * @returns {number}
 */
export function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay();
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string.
 * @param {string} dateStr
 * @param {number} days
 * @returns {string} YYYY-MM-DD
 */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const newY = date.getUTCFullYear();
  const newM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const newD = String(date.getUTCDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
}

/**
 * Checks if a given date falls on a configured class day.
 * @param {string} dateStr
 * @param {number[]} classDays Array of day indices, e.g. [1, 2, 3, 4, 5]
 * @returns {boolean}
 */
export function isClassDay(dateStr, classDays = [1, 2, 3, 4, 5]) {
  const day = getDayOfWeek(dateStr);
  return classDays.includes(day);
}

/**
 * Finds the first valid class day on or after the given date.
 * @param {string} dateStr
 * @param {number[]} classDays
 * @returns {string} YYYY-MM-DD
 */
export function getFirstClassDateOnOrAfter(dateStr, classDays = [1, 2, 3, 4, 5]) {
  if (classDays.length === 0) return dateStr;
  let curr = dateStr;
  let safetyCounter = 0;
  while (!isClassDay(curr, classDays) && safetyCounter < 14) {
    curr = addDays(curr, 1);
    safetyCounter++;
  }
  return curr;
}

/**
 * Calculates the next valid class day strictly AFTER the given date.
 * @param {string} dateStr
 * @param {number[]} classDays
 * @returns {string} YYYY-MM-DD
 */
export function getNextClassDate(dateStr, classDays = [1, 2, 3, 4, 5]) {
  if (classDays.length === 0) return addDays(dateStr, 1);
  let curr = addDays(dateStr, 1);
  let safetyCounter = 0;
  while (!isClassDay(curr, classDays) && safetyCounter < 14) {
    curr = addDays(curr, 1);
    safetyCounter++;
  }
  return curr;
}

/**
 * Compares two ISO date strings.
 * Returns -1 if a < b, 1 if a > b, 0 if equal.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareDates(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Formats a YYYY-MM-DD date into friendly text.
 * @param {string} dateStr
 * @param {Object} [options]
 * @param {boolean} [options.includeDayName=true]
 * @param {boolean} [options.shortMonth=false]
 * @returns {string} e.g. "Rabu, 30 September 2026" or "30 Sep 2026"
 */
export function formatDate(dateStr, { includeDayName = true, shortMonth = false } = {}) {
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

/**
 * Formats date into a short display like "30 Sep" or "Rabu, 30 Sep".
 * @param {string} dateStr
 * @param {boolean} [withDay=false]
 * @returns {string}
 */
export function formatShortDate(dateStr, withDay = false) {
  if (!isValidDateString(dateStr)) return dateStr;
  const [, m, d] = dateStr.split('-').map(Number);
  const monthName = INDONESIAN_MONTHS_SHORT[m - 1];
  if (withDay) {
    const dayName = INDONESIAN_DAYS[getDayOfWeek(dateStr)];
    return `${dayName}, ${d} ${monthName}`;
  }
  return `${d} ${monthName}`;
}

/**
 * Returns a human-friendly relative label compared to today.
 * E.g. "Hari Ini", "Besok", "Kemarin", or formatted date.
 * @param {string} dateStr
 * @param {string} [todayStr]
 * @returns {{ label: string, isToday: boolean, isTomorrow: boolean, isPast: boolean }}
 */
export function getRelativeDateInfo(dateStr, todayStr = getTodayDateString()) {
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
