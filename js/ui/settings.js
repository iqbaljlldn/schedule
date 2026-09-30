/**
 * Settings & Data Management View Component.
 * Class configuration, class days picker, export/import JSON, demo data reset.
 */
import { store } from '../core/store.js';
import { scheduleService } from '../services/schedule-service.js';
import { scheduleRepository } from '../repositories/local-storage-repository.js';
import { showToast } from './toast.js';
import { showConfirmDialog } from './modal.js';

export function renderSettings(container) {
  const state = store.getState();
  const classInfo = state.class || {
    name: '',
    startDate: '',
    classDays: [1, 2, 3, 4, 5],
    timezone: 'Asia/Jakarta'
  };

  const dayOptions = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 0, label: 'Minggu' }
  ];

  container.innerHTML = `
    <div class="settings-view-container">
      <div class="schedule-toolbar">
        <div class="toolbar-left">
          <h2 class="section-title">⚙️ Pengaturan & Manajemen Data</h2>
          <p class="section-desc">Konfigurasi hari aktif kelas, zona waktu, serta pencadangan data aplikasi.</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Class Configuration -->
        <section class="settings-card" aria-labelledby="class-config-heading">
          <div class="card-header">
            <h3 id="class-config-heading" class="card-title">🏫 Informasi & Jadwal Kelas</h3>
          </div>
          <form id="class-settings-form" class="card-body">
            <div class="form-group">
              <label for="class-name-input" class="form-label">Nama Kelas / Angkatan:</label>
              <input
                type="text"
                id="class-name-input"
                class="form-input"
                value="${escapeHtml(classInfo.name)}"
                placeholder="Contoh: Backend Engineering Batch #4"
                required
              />
            </div>

            <div class="form-group">
              <label for="class-start-date-input" class="form-label">Tanggal Mulai Kelas:</label>
              <input
                type="date"
                id="class-start-date-input"
                class="form-input"
                value="${classInfo.startDate || ''}"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Hari Aktif Kelas (Sesi Berjalan):</label>
              <p class="form-help">Hari yang tidak dicentang (misal Sabtu & Minggu) akan otomatis dilewati saat penghitungan tanggal.</p>
              <div class="class-days-grid">
                ${dayOptions
                  .map(
                    day => `
                    <label class="day-checkbox-label">
                      <input
                        type="checkbox"
                        name="class-days"
                        value="${day.value}"
                        ${classInfo.classDays.includes(day.value) ? 'checked' : ''}
                      />
                      <span>${day.label}</span>
                    </label>
                  `
                  )
                  .join('')}
              </div>
            </div>

            <div class="form-group">
              <label for="class-timezone-input" class="form-label">Zona Waktu:</label>
              <select id="class-timezone-input" class="form-select">
                <option value="Asia/Jakarta" ${classInfo.timezone === 'Asia/Jakarta' ? 'selected' : ''}>WIB (Asia/Jakarta - UTC+7)</option>
                <option value="Asia/Makassar" ${classInfo.timezone === 'Asia/Makassar' ? 'selected' : ''}>WITA (Asia/Makassar - UTC+8)</option>
                <option value="Asia/Jayapura" ${classInfo.timezone === 'Asia/Jayapura' ? 'selected' : ''}>WIT (Asia/Jayapura - UTC+9)</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary">
              Simpan Pengaturan Kelas
            </button>
          </form>
        </section>

        <!-- Backup & Data Management -->
        <section class="settings-card" aria-labelledby="backup-heading">
          <div class="card-header">
            <h3 id="backup-heading" class="card-title">💾 Backup & Pemulihan Data</h3>
          </div>
          <div class="card-body">
            <p class="settings-text">
              Aplikasi menyimpan seluruh jadwal dan data siswa secara lokal di browser Anda (<code>localStorage</code>).
              Simpan cadangan file secara berkala agar data tidak hilang saat membersihkan cache browser.
            </p>

            <div class="settings-action-list">
              <div class="settings-action-item">
                <div class="action-info">
                  <strong>Ekspor Cadangan (JSON)</strong>
                  <span>Unduh berkas JSON berisi seluruh data siswa, riwayat, dan jadwal saat ini.</span>
                </div>
                <button class="btn btn-secondary" id="btn-export-json" type="button">
                  ⬇ Unduh Backup
                </button>
              </div>

              <div class="settings-action-item">
                <div class="action-info">
                  <strong>Impor Cadangan (JSON)</strong>
                  <span>Pulihkan data kelas dari file backup JSON sebelumnya. Data lama akan digantikan.</span>
                </div>
                <div>
                  <input type="file" id="import-file-input" accept=".json,application/json" hidden />
                  <button class="btn btn-secondary" id="btn-trigger-import" type="button">
                    ⬆ Impor File
                  </button>
                </div>
              </div>

              <div class="settings-action-item">
                <div class="action-info">
                  <strong>Muat Ulang Data Contoh (Demo)</strong>
                  <span>Kembalikan data simulasi kelas dengan riwayat sesi dan siswa contoh.</span>
                </div>
                <button class="btn btn-subtle" id="btn-load-demo" type="button">
                  Muat Data Demo
                </button>
              </div>

              <div class="settings-action-item is-danger-zone">
                <div class="action-info">
                  <strong class="text-danger">Reset Semua Data</strong>
                  <span>Hapus seluruh siswa dan riwayat jadwal. Gunakan untuk menyiapkan kelas baru dari nol.</span>
                </div>
                <button class="btn btn-danger" id="btn-reset-data" type="button">
                  Reset Semua
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  attachSettingsEvents(container);
}

function attachSettingsEvents(container) {
  // Save class configuration
  const form = container.querySelector('#class-settings-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = container.querySelector('#class-name-input').value.trim();
    const startDate = container.querySelector('#class-start-date-input').value;
    const timezone = container.querySelector('#class-timezone-input').value;

    const checkedDays = Array.from(
      container.querySelectorAll('input[name="class-days"]:checked')
    ).map(cb => Number(cb.value));

    if (checkedDays.length === 0) {
      showToast('Pilih minimal satu hari aktif kelas.', 'warning');
      return;
    }

    scheduleService.updateClassInfo({
      name,
      startDate,
      classDays: checkedDays,
      timezone
    });

    showToast('Pengaturan kelas berhasil disimpan dan tanggal jadwal disesuaikan.', 'success');
  });

  // Export JSON
  container.querySelector('#btn-export-json').addEventListener('click', () => {
    try {
      const state = store.getState();
      scheduleRepository.exportBackup(state);
      showToast('File cadangan JSON berhasil diunduh.', 'success');
    } catch (err) {
      showToast('Gagal mengunduh file cadangan.', 'error');
    }
  });

  // Trigger Import File
  const fileInput = container.querySelector('#import-file-input');
  const triggerBtn = container.querySelector('#btn-trigger-import');
  triggerBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await scheduleRepository.importBackup(file);
      const studentCount = parsedData.students?.length || 0;
      const scheduleCount = parsedData.schedule?.length || 0;

      const confirmed = await showConfirmDialog({
        title: 'Konfirmasi Impor Data',
        message: `File cadangan valid (${studentCount} siswa, ${scheduleCount} jadwal). Timpa data kelas saat ini dengan file ini?`,
        confirmText: 'Ya, Timpa Data',
        cancelText: 'Batal',
        isDestructive: true
      });

      if (confirmed) {
        store.replaceState(parsedData);
        showToast('Data cadangan berhasil dipulihkan!', 'success');
        fileInput.value = '';
      }
    } catch (err) {
      showToast(err.message || 'Gagal memproses file cadangan.', 'error', 5000);
      fileInput.value = '';
    }
  });

  // Load Demo Data
  container.querySelector('#btn-load-demo').addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'Muat Data Demo?',
      message: 'Muat ulang data contoh kelas "Backend Engineering"? Data yang ada saat ini akan diganti.',
      confirmText: 'Muat Data Demo',
      cancelText: 'Batal',
      isDestructive: false
    });

    if (confirmed) {
      store.resetToDemo();
      showToast('Data contoh kelas berhasil dimuat!', 'success');
    }
  });

  // Reset All Data
  container.querySelector('#btn-reset-data').addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Semua Data Kelas?',
      message: 'Semua daftar siswa dan seluruh riwayat jadwal akan dihapus secara permanen. Pastikan Anda sudah mengekspor backup jika masih membutuhkannya.',
      confirmText: 'Ya, Hapus Semua',
      cancelText: 'Batal',
      isDestructive: true
    });

    if (confirmed) {
      store.resetToEmpty();
      showToast('Data aplikasi telah dikosongkan.', 'info');
      // Redirect to Setup wizard or dashboard
      document.querySelector('[data-tab="dashboard"]')?.click();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
