/**
 * Schedule (Jadwal Lengkap) View Component.
 * Supports chronological queue ordering, move up/down, swap, postpone, skip, and filtering.
 */
import { scheduleService } from '../services/schedule-service.js';
import { formatDate, formatShortDate } from '../utils/date.js';
import { showToast } from './toast.js';
import { showConfirmDialog, openModal, closeModal } from './modal.js';
import { openPostponeDialog, openSwapDialog, openNoteDialog } from './dashboard.js';
import { store } from '../core/store.js';

let currentFilter = 'all'; // 'all' | 'upcoming' | 'completed' | 'postponed'
let currentSearch = '';

export function renderSchedule(container) {
  const state = store.getState();
  const schedule = scheduleService.getSortedSchedule();
  const today = scheduleService.getTodayDate();
  const stats = scheduleService.getStatistics();

  // Filter and search
  const filteredSchedule = schedule.filter(item => {
    // Filter by tab
    if (currentFilter === 'upcoming') {
      if (item.status === 'completed' || item.date < today) return false;
    } else if (currentFilter === 'completed') {
      if (item.status !== 'completed') return false;
    } else if (currentFilter === 'postponed') {
      if (item.status !== 'postponed') return false;
    }

    // Search query
    if (currentSearch.trim()) {
      const q = currentSearch.toLowerCase().trim();
      const matchName = item.student.name.toLowerCase().includes(q);
      const matchNote = item.note ? item.note.toLowerCase().includes(q) : false;
      const matchDate = item.date.includes(q);
      return matchName || matchNote || matchDate;
    }

    return true;
  });

  const filterCounts = {
    all: schedule.length,
    upcoming: schedule.filter(s => s.status !== 'completed' && s.date >= today).length,
    completed: stats.completedCount,
    postponed: stats.postponedCount
  };

  container.innerHTML = `
    <div class="schedule-view-container">
      <div class="schedule-toolbar">
        <div class="toolbar-left">
          <h2 class="section-title">📅 Jadwal Lengkap Public Speaking</h2>
          <p class="section-desc">Urutan antrean bicara kelas. Pindahkan atau tukar giliran tanpa merusak riwayat.</p>
        </div>
        <div class="toolbar-actions">
          <button class="btn btn-secondary" id="btn-start-next-round" type="button" title="Mulai putaran baru untuk seluruh kelas">
            ✨ Mulai Putaran Baru (Round ${stats.totalRounds + 1})
          </button>
          <button class="btn btn-secondary" id="btn-shuffle-upcoming" type="button" title="Acak urutan pembicara yang belum maju">
            🎲 Acak Urutan Mendatang
          </button>
          <button class="btn btn-primary" id="btn-add-schedule-entry" type="button">
            + Tambah Siswa ke Jadwal
          </button>
        </div>
      </div>

      <div class="schedule-controls-bar">
        <div class="filter-tabs" role="tablist">
          <button class="tab-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all" role="tab" aria-selected="${currentFilter === 'all'}">
            Semua (${filterCounts.all})
          </button>
          <button class="tab-btn ${currentFilter === 'upcoming' ? 'active' : ''}" data-filter="upcoming" role="tab" aria-selected="${currentFilter === 'upcoming'}">
            Mendatang (${filterCounts.upcoming})
          </button>
          <button class="tab-btn ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed" role="tab" aria-selected="${currentFilter === 'completed'}">
            Selesai (${filterCounts.completed})
          </button>
          <button class="tab-btn ${currentFilter === 'postponed' ? 'active' : ''}" data-filter="postponed" role="tab" aria-selected="${currentFilter === 'postponed'}">
            Ditunda (${filterCounts.postponed})
          </button>
        </div>

        <div class="search-box">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="schedule-search-input"
            class="search-input"
            placeholder="Cari nama siswa atau topik..."
            value="${escapeHtml(currentSearch)}"
            aria-label="Cari jadwal"
          />
          ${
            currentSearch
              ? `<button class="search-clear-btn" id="btn-clear-schedule-search" type="button" aria-label="Hapus pencarian">×</button>`
              : ''
          }
        </div>
      </div>

      <div class="schedule-list" role="list">
        ${
          filteredSchedule.length === 0
            ? `
            <div class="empty-state-box">
              <span class="empty-state-icon">📋</span>
              <h3 class="empty-state-title">Tidak ada jadwal ditemukan</h3>
              <p class="empty-state-text">
                ${
                  currentSearch
                    ? `Tidak ada hasil untuk pencarian "${escapeHtml(currentSearch)}".`
                    : 'Belum ada data jadwal untuk kategori filter ini.'
                }
              </p>
            </div>
          `
            : filteredSchedule
                .map((item, index) => renderScheduleItem(item, today, index, filteredSchedule.length))
                .join('')
        }
      </div>
    </div>
  `;

  attachScheduleEvents(container);
}

function renderScheduleItem(item, today, index, totalItems) {
  const isToday = item.date === today;
  const isPast = item.date < today;
  const isCompleted = item.status === 'completed';
  const isPostponed = item.status === 'postponed';
  const isSkipped = item.status === 'skipped';
  const canReorder = !isPast && !isCompleted;

  let rowClass = 'schedule-item-card';
  if (isToday) rowClass += ' is-today-card';
  if (isCompleted) rowClass += ' is-completed-card';
  if (isPostponed) rowClass += ' is-postponed-card';

  return `
    <article class="${rowClass}" data-schedule-id="${item.id}" role="listitem">
      <div class="schedule-col-reorder">
        <button
          class="btn-reorder btn-move-up"
          data-id="${item.id}"
          type="button"
          title="Geser naik (lebih awal)"
          aria-label="Geser ${escapeHtml(item.student.name)} lebih awal"
          ${!canReorder ? 'disabled' : ''}
        >
          ▲
        </button>
        <span class="session-badge-pill" title="Sesi Ke-${item.sessionNumber}">#${item.sessionNumber}</span>
        <button
          class="btn-reorder btn-move-down"
          data-id="${item.id}"
          type="button"
          title="Geser turun (lebih akhir)"
          aria-label="Geser ${escapeHtml(item.student.name)} lebih akhir"
          ${!canReorder ? 'disabled' : ''}
        >
          ▼
        </button>
      </div>

      <div class="schedule-col-date">
        <span class="schedule-date-day">${formatDate(item.date, { includeDayName: true, shortMonth: true })}</span>
        <span class="schedule-date-relative ${isToday ? 'relative-today' : ''}">
          ${isToday ? '● HARI INI' : item.relativeDate.label}
        </span>
      </div>

      <div class="schedule-col-student">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:2px;">
          <h3 class="schedule-student-name">${escapeHtml(item.student.name)}</h3>
          <span class="badge badge-neutral badge-sm">Putaran #${item.round || 1}</span>
          ${
            item.isCarryOver
              ? `<span class="badge badge-warning badge-sm" title="Tunggakan dari Putaran #${item.carryOverFromRound}">⚠️ Carry-over Putaran #${item.carryOverFromRound}</span>`
              : ''
          }
        </div>
        ${
          item.note
            ? `<div class="schedule-note-badge" title="${escapeHtml(item.note)}">
                <span aria-hidden="true">📝</span> ${escapeHtml(item.note)}
               </div>`
            : ''
        }
      </div>

      <div class="schedule-col-status">
        ${renderStatusBadge(item.status)}
      </div>

      <div class="schedule-col-actions">
        <div class="action-buttons-group">
          ${
            isCompleted
              ? `
              <button class="btn-subtle btn-revert-action" data-id="${item.id}" type="button" title="Kembalikan ke belum selesai">
                ↺ Batal Selesai
              </button>
            `
              : `
              <button class="btn-subtle btn-complete-action" data-id="${item.id}" type="button" title="Tandai selesai">
                ✓ Selesai
              </button>
            `
          }
          <button class="btn-subtle btn-swap-action" data-id="${item.id}" type="button" title="Tukar posisi dengan siswa lain" ${isCompleted ? 'disabled' : ''}>
            ⇄ Tukar
          </button>
          <button class="btn-subtle btn-postpone-action" data-id="${item.id}" type="button" title="Tunda ke antrean akhir" ${isCompleted ? 'disabled' : ''}>
            ⏱ Tunda
          </button>
          <div class="dropdown-container">
            <button class="btn-subtle btn-menu-dots" data-id="${item.id}" type="button" aria-label="Menu aksi lainnya" aria-haspopup="true">
              ⋮
            </button>
            <div class="dropdown-menu" id="menu-${item.id}" hidden>
              <button class="dropdown-item btn-menu-note" data-id="${item.id}" type="button">✎ Ubah Catatan</button>
              <button class="dropdown-item btn-menu-skip" data-id="${item.id}" type="button" ${isCompleted ? 'disabled' : ''}>⊘ Lewati Giliran</button>
              <hr class="dropdown-divider" />
              <button class="dropdown-item text-danger btn-menu-delete" data-id="${item.id}" type="button">✕ Hapus dari Jadwal</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderStatusBadge(status) {
  switch (status) {
    case 'completed':
      return `<span class="badge badge-success badge-sm">✓ Selesai</span>`;
    case 'postponed':
      return `<span class="badge badge-warning badge-sm">⏱ Ditunda</span>`;
    case 'skipped':
      return `<span class="badge badge-danger badge-sm">⊘ Dilewati</span>`;
    case 'scheduled':
    default:
      return `<span class="badge badge-primary badge-sm">Dijadwalkan</span>`;
  }
}

function attachScheduleEvents(container) {
  // Filter tabs
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter');
      renderSchedule(container);
    });
  });

  // Search input
  const searchInput = container.querySelector('#schedule-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderSchedule(container);
      // Keep focus on search input
      const newSearch = container.querySelector('#schedule-search-input');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(currentSearch.length, currentSearch.length);
      }
    });
  }

  // Clear search
  container.querySelector('#btn-clear-schedule-search')?.addEventListener('click', () => {
    currentSearch = '';
    renderSchedule(container);
  });

  // Move UP
  container.querySelectorAll('.btn-move-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      try {
        const moved = scheduleService.moveEntry(id, 'up');
        if (moved) {
          showToast('Urutan giliran berhasil dimajukan.', 'success', 2000);
        }
      } catch (err) {
        showToast(err.message, 'warning');
      }
    });
  });

  // Move DOWN
  container.querySelectorAll('.btn-move-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      try {
        const moved = scheduleService.moveEntry(id, 'down');
        if (moved) {
          showToast('Urutan giliran berhasil digeser ke bawah.', 'success', 2000);
        }
      } catch (err) {
        showToast(err.message, 'warning');
      }
    });
  });

  // Mark Completed
  container.querySelectorAll('.btn-complete-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      scheduleService.completeEntry(id);
      showToast('Sesi berhasil ditandai selesai! 🎉', 'success');
    });
  });

  // Revert Completed
  container.querySelectorAll('.btn-revert-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      scheduleService.revertEntry(id);
      showToast('Status sesi dikembalikan ke dijadwalkan.', 'info');
    });
  });

  // Swap
  container.querySelectorAll('.btn-swap-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openSwapDialog(id);
    });
  });

  // Postpone
  container.querySelectorAll('.btn-postpone-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const schedule = scheduleService.getSortedSchedule();
      const entry = schedule.find(s => s.id === id);
      if (entry) openPostponeDialog(entry);
    });
  });

  // Dropdown menu toggle
  container.querySelectorAll('.btn-menu-dots').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const menu = container.querySelector(`#menu-${id}`);
      const isHidden = menu.hasAttribute('hidden');

      // Close other open menus
      container.querySelectorAll('.dropdown-menu').forEach(m => m.setAttribute('hidden', ''));

      if (isHidden) {
        menu.removeAttribute('hidden');
      }
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    container.querySelectorAll('.dropdown-menu').forEach(m => m.setAttribute('hidden', ''));
  });

  // Dropdown Edit Note
  container.querySelectorAll('.btn-menu-note').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const schedule = scheduleService.getSortedSchedule();
      const entry = schedule.find(s => s.id === id);
      if (entry) openNoteDialog(entry);
    });
  });

  // Dropdown Skip
  container.querySelectorAll('.btn-menu-skip').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const schedule = scheduleService.getSortedSchedule();
      const entry = schedule.find(s => s.id === id);
      if (!entry) return;

      const confirmed = await showConfirmDialog({
        title: 'Lewati Giliran?',
        message: `Apakah Anda yakin ingin melewati giliran ${entry.student.name}? Slot waktu akan diberikan ke siswa berikutnya.`,
        confirmText: 'Ya, Lewati',
        cancelText: 'Batal',
        isDestructive: false
      });

      if (confirmed) {
        scheduleService.skipEntry(id, 'Dilewati oleh pengajar');
        showToast(`Giliran ${entry.student.name} dilewati. Antrean dimajukan.`, 'warning');
      }
    });
  });

  // Dropdown Delete Entry
  container.querySelectorAll('.btn-menu-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const schedule = scheduleService.getSortedSchedule();
      const entry = schedule.find(s => s.id === id);
      if (!entry) return;

      const confirmed = await showConfirmDialog({
        title: 'Hapus Sesi Jadwal?',
        message: `Hapus sesi ${entry.student.name} (${formatShortDate(entry.date)}) dari jadwal? Tanggal berikutnya akan otomatis disesuaikan.`,
        confirmText: 'Hapus Sesi',
        cancelText: 'Batal',
        isDestructive: true
      });

      if (confirmed) {
        scheduleService.deleteScheduleEntry(id);
        showToast('Sesi berhasil dihapus dari jadwal.', 'info');
      }
    });
  });

  // Shuffle Upcoming
  container.querySelector('#btn-shuffle-upcoming')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'Acak Urutan Pembicara?',
      message: 'Sistem akan mengacak posisi siswa yang BELUM maju secara acak dan adil. Riwayat sesi yang telah selesai tidak akan terpengaruh.',
      confirmText: 'Ya, Acak Urutan',
      cancelText: 'Batal',
      isDestructive: false
    });

    if (confirmed) {
      scheduleService.shuffleUpcoming();
      showToast('Urutan giliran mendatang berhasil diacak! 🎲', 'success');
    }
  });

  // Start Next Round
  container.querySelector('#btn-start-next-round')?.addEventListener('click', async () => {
    const stats = scheduleService.getStatistics();
    const nextRoundNum = stats.totalRounds + 1;

    const confirmed = await showConfirmDialog({
      title: `Mulai Putaran #${nextRoundNum}?`,
      message: `Sistem akan otomatis menjadwalkan seluruh ${stats.totalStudents} siswa aktif untuk Putaran #${nextRoundNum} melanjutkan jadwal yang ada. Siap memulai putaran baru?`,
      confirmText: `Ya, Buat Putaran #${nextRoundNum}`,
      cancelText: 'Batal',
      isDestructive: false
    });

    if (confirmed) {
      scheduleService.startNextRound();
      showToast(`Putaran #${nextRoundNum} berhasil dibuat untuk seluruh kelas! 🎉`, 'success', 3500);
    }
  });

  // Add Schedule Entry Modal
  container.querySelector('#btn-add-schedule-entry')?.addEventListener('click', () => {
    openAddScheduleModal();
  });
}

function openAddScheduleModal() {
  const state = store.getState();
  let modal = document.getElementById('add-schedule-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'add-schedule-modal';
    modal.className = 'modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'add-sched-title');
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card animate-pop">
      <div class="modal-header">
        <h2 id="add-sched-title" class="modal-title">+ Tambah Siswa ke Jadwal</h2>
        <button class="modal-close-btn" type="button" aria-label="Tutup dialog">×</button>
      </div>
      <form id="add-schedule-form" class="modal-body">
        <div class="form-group">
          <label for="sched-student-type" class="form-label">Tipe Penambahan:</label>
          <select id="sched-student-type" class="form-select">
            <option value="existing">Pilih Siswa yang Sudah Terdaftar</option>
            <option value="new">+ Daftarkan Siswa Baru</option>
          </select>
        </div>

        <div id="existing-student-group" class="form-group">
          <label for="select-existing-student" class="form-label">Pilih Siswa:</label>
          <select id="select-existing-student" class="form-select">
            ${
              state.students.length === 0
                ? '<option value="">Belum ada siswa terdaftar</option>'
                : state.students
                    .filter(s => s.active)
                    .map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
                    .join('')
            }
          </select>
        </div>

        <div id="new-student-group" class="form-group" hidden>
          <label for="new-student-name" class="form-label">Nama Siswa Baru:</label>
          <input type="text" id="new-student-name" class="form-input" placeholder="Contoh: Rian Pratama" />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">Tambahkan ke Jadwal</button>
        </div>
      </form>
    </div>
  `;

  const closeHandler = () => closeModal(modal);
  modal.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
  modal.querySelector('.modal-cancel-btn').addEventListener('click', closeHandler);

  const typeSelect = modal.querySelector('#sched-student-type');
  const existingGroup = modal.querySelector('#existing-student-group');
  const newGroup = modal.querySelector('#new-student-group');

  typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'new') {
      existingGroup.setAttribute('hidden', '');
      newGroup.removeAttribute('hidden');
      modal.querySelector('#new-student-name').focus();
    } else {
      existingGroup.removeAttribute('hidden');
      newGroup.setAttribute('hidden', '');
    }
  });

  modal.querySelector('#add-schedule-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (typeSelect.value === 'new') {
      const name = modal.querySelector('#new-student-name').value.trim();
      if (!name) {
        showToast('Masukkan nama siswa terlebih dahulu.', 'warning');
        return;
      }
      scheduleService.addStudent({ name }, true);
      closeModal(modal);
      showToast(`Siswa "${name}" berhasil didaftarkan dan dijadwalkan.`, 'success');
    } else {
      const studentId = modal.querySelector('#select-existing-student').value;
      if (!studentId) {
        showToast('Pilih siswa yang terdaftar.', 'warning');
        return;
      }
      const student = state.students.find(s => s.id === studentId);
      // Append new schedule entry for existing student
      const today = scheduleService.getTodayDate();
      const newEntry = {
        id: `schedule-${Date.now().toString(36)}`,
        studentId,
        date: today,
        status: 'scheduled',
        completedAt: null,
        note: null
      };
      const updatedSchedule = scheduleService.recalculateDatesArray(
        [...state.schedule, newEntry],
        state.class.classDays,
        today
      );
      store.setState({ ...state, schedule: updatedSchedule });
      closeModal(modal);
      showToast(`Sesi baru untuk ${student.name} berhasil ditambahkan ke jadwal.`, 'success');
    }
  });

  openModal(modal);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
