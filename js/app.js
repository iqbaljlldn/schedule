/**
 * Main Application Orchestrator & Router.
 */
import { store } from './core/store.js';
import { scheduleService } from './services/schedule-service.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderSchedule } from './ui/schedule.js';
import { renderStudents } from './ui/students.js';
import { renderSettings } from './ui/settings.js';
import { showToast } from './ui/toast.js';
import { openModal, closeModal } from './ui/modal.js';

let currentTab = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupGlobalErrorHandling();
  setupTheme();

  // Initialize data store
  store.init();

  // Setup tab navigation
  setupNavigation();

  // Setup keyboard shortcuts
  setupShortcuts();

  // Initial render
  renderApp();

  // Subscribe to store updates
  store.subscribe(() => {
    renderApp();
  });

  // Check if initial setup is needed
  checkInitialSetup();
}

function renderApp() {
  const state = store.getState();
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Update header class title
  const classTitleEl = document.getElementById('header-class-name');
  if (classTitleEl) {
    classTitleEl.textContent = state?.class?.name || 'Motivational Show Tracker';
  }

  // Update stats counters
  const stats = scheduleService.getStatistics();
  const todayEntry = scheduleService.getTodayEntry();
  const todayBadge = document.getElementById('nav-today-badge');
  if (todayBadge) {
    if (todayEntry) {
      todayBadge.textContent = todayEntry.student.name.split(' ')[0];
      todayBadge.className = `nav-pill-badge ${todayEntry.status === 'completed' ? 'badge-pill-success' : 'badge-pill-active'}`;
    } else {
      todayBadge.textContent = 'Kosong';
      todayBadge.className = 'nav-pill-badge badge-pill-muted';
    }
  }

  // Render active tab view
  switch (currentTab) {
    case 'schedule':
      renderSchedule(mainContent);
      break;
    case 'students':
      renderStudents(mainContent);
      break;
    case 'settings':
      renderSettings(mainContent);
      break;
    case 'dashboard':
    default:
      renderDashboard(mainContent);
      break;
  }
}

function setupNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (!tab || tab === currentTab) return;

      currentTab = tab;
      navTabs.forEach(b => {
        const isActive = b.getAttribute('data-tab') === currentTab;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function setupTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('ps-tracker-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const activeTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', activeTheme);
  updateThemeIcon(activeTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('ps-tracker-theme', nextTheme);
      updateThemeIcon(nextTheme);
      showToast(`Mode tampilan diubah ke ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`, 'info', 1500);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function setupShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts when user is typing in inputs or textareas
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      return;
    }

    const key = e.key.toUpperCase();

    if (key === 'T' || key === '1') {
      document.querySelector('[data-tab="dashboard"]')?.click();
    } else if (key === 'S' || key === '2') {
      document.querySelector('[data-tab="schedule"]')?.click();
    } else if (key === 'M' || key === '3') {
      document.querySelector('[data-tab="students"]')?.click();
    } else if (key === 'P' || key === '4') {
      document.querySelector('[data-tab="settings"]')?.click();
    } else if (key === 'D') {
      document.getElementById('theme-toggle-btn')?.click();
    } else if (key === '?') {
      openShortcutsModal();
    }
  });

  document.getElementById('btn-help-shortcuts')?.addEventListener('click', openShortcutsModal);
}

function openShortcutsModal() {
  let modal = document.getElementById('shortcuts-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'shortcuts-title');
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card animate-pop">
      <div class="modal-header">
        <h2 id="shortcuts-title" class="modal-title">⌨️ Pintasan Keyboard</h2>
        <button class="modal-close-btn" type="button" aria-label="Tutup dialog">×</button>
      </div>
      <div class="modal-body">
        <ul class="shortcuts-list">
          <li><kbd>T</kbd> atau <kbd>1</kbd> <span>Buka halaman <strong>Hari Ini (Today)</strong></span></li>
          <li><kbd>S</kbd> atau <kbd>2</kbd> <span>Buka halaman <strong>Jadwal Lengkap</strong></span></li>
          <li><kbd>M</kbd> atau <kbd>3</kbd> <span>Buka halaman <strong>Daftar Siswa</strong></span></li>
          <li><kbd>P</kbd> atau <kbd>4</kbd> <span>Buka halaman <strong>Pengaturan</strong></span></li>
          <li><kbd>D</kbd> <span>Beralih <strong>Mode Gelap / Terang</strong></span></li>
          <li><kbd>?</kbd> <span>Tampilkan bantuan pintasan ini</span></li>
          <li><kbd>Esc</kbd> <span>Tutup popup / modal yang sedang aktif</span></li>
        </ul>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary modal-close-btn">Mengerti</button>
      </div>
    </div>
  `;

  const closeHandler = () => closeModal(modal);
  modal.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeHandler));
  openModal(modal);
}

function checkInitialSetup() {
  const state = store.getState();
  if (!state.class.name && state.students.length === 0) {
    openSetupWizardModal();
  }
}

function openSetupWizardModal() {
  let modal = document.getElementById('setup-wizard-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'setup-wizard-modal';
    modal.className = 'modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'setup-title');
    document.body.appendChild(modal);
  }

  const todayStr = scheduleService.getTodayDate();

  modal.innerHTML = `
    <div class="modal-card modal-lg animate-pop">
      <div class="modal-header">
        <h2 id="setup-title" class="modal-title">🎓 Selamat Datang di Motivational Show Tracker!</h2>
      </div>
      <form id="setup-wizard-form" class="modal-body">
        <p class="modal-desc">
          Mulai dengan menyiapkan kelas Anda atau langsung coba dengan data contoh simulasi.
        </p>

        <div class="form-group">
          <label for="wizard-class-name" class="form-label">Nama Kelas / Angkatan:</label>
          <input type="text" id="wizard-class-name" class="form-input" placeholder="Contoh: Backend Engineering Batch #4" required />
        </div>

        <div class="form-group">
          <label for="wizard-start-date" class="form-label">Tanggal Mulai:</label>
          <input type="date" id="wizard-start-date" class="form-input" value="${todayStr}" required />
        </div>

        <div class="form-group">
          <label for="wizard-students-list" class="form-label">Daftar Nama Siswa (satu baris per siswa):</label>
          <textarea id="wizard-students-list" class="form-textarea" rows="5" placeholder="Alice Prasetyo&#10;Budi Santoso&#10;Cindy Claudia&#10;Dimas Ramadhan"></textarea>
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <button type="button" class="btn btn-secondary" id="btn-wizard-load-demo">
            ✨ Coba dengan Data Contoh (Demo)
          </button>
          <button type="submit" class="btn btn-primary">
            Buat Jadwal Kelas 🚀
          </button>
        </div>
      </form>
    </div>
  `;

  modal.querySelector('#btn-wizard-load-demo').addEventListener('click', () => {
    store.resetToDemo();
    closeModal(modal);
    showToast('Data demo berhasil dimuat! Selamat mencoba!', 'success');
  });

  modal.querySelector('#setup-wizard-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modal.querySelector('#wizard-class-name').value.trim();
    const startDate = modal.querySelector('#wizard-start-date').value;
    const rawStudents = modal.querySelector('#wizard-students-list').value;

    const names = rawStudents
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const students = names.map((sName, idx) => ({
      id: `student-${idx + 1}`,
      name: sName,
      active: true
    }));

    const classDays = [1, 2, 3, 4, 5];
    const schedule = scheduleService.generateScheduleFromScratch(students, startDate, classDays);

    store.setState({
      version: 1,
      class: {
        name,
        startDate,
        classDays,
        timezone: 'Asia/Jakarta'
      },
      students,
      schedule
    });

    closeModal(modal);
    showToast(`Kelas "${name}" berhasil dibuat dengan ${students.length} siswa!`, 'success');
  });

  openModal(modal);
}

function setupGlobalErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Unhandled UI error caught:', event.error);
    showToast('Terjadi kendala teknis pada tampilan. Silakan coba kembali.', 'error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise rejection:', event.reason);
    showToast('Terjadi kesalahan proses. Data tetap aman.', 'error');
  });
}
