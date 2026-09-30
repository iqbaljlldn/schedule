/**
 * Schema and integrity validation for schedule data.
 */
import { isValidDateString } from './date.js';

export const VALID_STATUSES = ['scheduled', 'completed', 'postponed', 'skipped'];

/**
 * Validates a complete state payload (used for import and persistence integrity).
 * @param {any} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateScheduleData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Format data tidak valid: bukan sebuah objek JSON.'] };
  }

  // Version check
  if (typeof data.version !== 'number' || data.version < 1) {
    errors.push('Versi data ("version") harus berupa angka >= 1.');
  }

  // Class info check
  if (!data.class || typeof data.class !== 'object') {
    errors.push('Data kelas ("class") tidak ditemukan.');
  } else {
    if (!data.class.name || typeof data.class.name !== 'string' || !data.class.name.trim()) {
      errors.push('Nama kelas ("class.name") wajib diisi.');
    }
    if (!isValidDateString(data.class.startDate)) {
      errors.push('Tanggal mulai kelas ("class.startDate") tidak valid (format YYYY-MM-DD).');
    }
    if (
      !Array.isArray(data.class.classDays) ||
      data.class.classDays.length === 0 ||
      !data.class.classDays.every(d => Number.isInteger(d) && d >= 0 && d <= 6)
    ) {
      errors.push('Hari kelas ("class.classDays") harus berupa daftar angka 0-6 (0=Minggu, 1=Senin, dst).');
    }
  }

  // Students check
  const studentIds = new Set();
  if (!Array.isArray(data.students)) {
    errors.push('Daftar siswa ("students") harus berupa array.');
  } else {
    data.students.forEach((s, idx) => {
      if (!s || typeof s !== 'object') {
        errors.push(`Siswa pada indeks ${idx} tidak valid.`);
        return;
      }
      if (!s.id || typeof s.id !== 'string') {
        errors.push(`Siswa pada indeks ${idx} tidak memiliki ID.`);
      } else if (studentIds.has(s.id)) {
        errors.push(`ID siswa duplikat ditemukan: "${s.id}".`);
      } else {
        studentIds.add(s.id);
      }
      if (!s.name || typeof s.name !== 'string' || !s.name.trim()) {
        errors.push(`Siswa "${s.id || idx}" harus memiliki nama yang tidak kosong.`);
      }
    });
  }

  // Schedule check
  const scheduleIds = new Set();
  if (!Array.isArray(data.schedule)) {
    errors.push('Daftar jadwal ("schedule") harus berupa array.');
  } else {
    data.schedule.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Jadwal pada indeks ${idx} tidak valid.`);
        return;
      }
      if (!item.id || typeof item.id !== 'string') {
        errors.push(`Jadwal pada indeks ${idx} tidak memiliki ID.`);
      } else if (scheduleIds.has(item.id)) {
        errors.push(`ID jadwal duplikat ditemukan: "${item.id}".`);
      } else {
        scheduleIds.add(item.id);
      }

      if (!item.studentId || typeof item.studentId !== 'string') {
        errors.push(`Jadwal "${item.id || idx}" tidak memiliki referensi studentId.`);
      } else if (!studentIds.has(item.studentId)) {
        errors.push(`Jadwal "${item.id}" merujuk pada siswa yang tidak ada: "${item.studentId}".`);
      }

      if (!isValidDateString(item.date)) {
        errors.push(`Jadwal "${item.id}" memiliki format tanggal tidak valid: "${item.date}".`);
      }

      if (!VALID_STATUSES.includes(item.status)) {
        errors.push(`Jadwal "${item.id}" memiliki status tidak valid: "${item.status}".`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
