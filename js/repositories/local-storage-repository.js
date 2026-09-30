/**
 * LocalStorage Repository for public speaking schedule.
 * Handles persistence, versioning, backup export, and import validation.
 */
import { validateScheduleData } from '../utils/validation.js';
import { getTodayDateString } from '../utils/date.js';

export const STORAGE_KEY = 'public-speaking-schedule:v2';

export class LocalStorageRepository {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Loads schedule data from localStorage.
   * If parsing fails or data is corrupted, returns null safely without throwing uncaught error.
   * @returns {Object|null}
   */
  loadSchedule() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const validation = validateScheduleData(parsed);

      if (!validation.valid) {
        console.warn('Data localStorage terdeteksi tidak valid:', validation.errors);
        return null;
      }

      return parsed;
    } catch (err) {
      console.error('Gagal membaca data dari localStorage:', err);
      return null;
    }
  }

  /**
   * Saves schedule state to localStorage.
   * @param {Object} data
   * @returns {boolean} True if saved successfully
   */
  saveSchedule(data) {
    try {
      const raw = JSON.stringify(data);
      localStorage.setItem(this.storageKey, raw);
      return true;
    } catch (err) {
      console.error('Gagal menyimpan data ke localStorage (mungkin kuota habis):', err);
      return false;
    }
  }

  /**
   * Removes schedule data from localStorage.
   */
  clearSchedule() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (err) {
      console.error('Gagal menghapus data dari localStorage:', err);
      return false;
    }
  }

  /**
   * Generates a downloadable JSON backup file.
   * @param {Object} data
   */
  exportBackup(data) {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const today = getTodayDateString();
      const a = document.createElement('a');
      a.href = url;
      a.download = `public-speaking-schedule-backup-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Gagal mengekspor file backup:', err);
      throw new Error('Gagal mengekspor data backup.');
    }
  }

  /**
   * Reads and parses a backup JSON file from user upload.
   * @param {File} file
   * @returns {Promise<Object>}
   */
  importBackup(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('Pilih file backup JSON terlebih dahulu.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);
          const validation = validateScheduleData(parsed);

          if (!validation.valid) {
            return reject(new Error(`Format data tidak valid:\n• ${validation.errors.join('\n• ')}`));
          }

          resolve(parsed);
        } catch (err) {
          reject(new Error('File tidak dapat dibaca sebagai format JSON yang valid.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Gagal membaca file dari perangkat Anda.'));
      };

      reader.readAsText(file);
    });
  }
}

// Singleton repository instance
export const scheduleRepository = new LocalStorageRepository();
