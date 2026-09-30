/**
 * Dashboard (Today's Speaker) View Component.
 * Answers immediately: "Hari ini siapa yang maju?"
 */
import { scheduleService } from '../services/schedule-service.js';
import { formatDate, formatShortDate, getRelativeDateInfo } from '../utils/date.js';
import { showToast } from './toast.js';
import { openModal, closeModal, showConfirmDialog } from './modal.js';

export function renderDashboard(container) {
  const todayEntry = scheduleService.getTodayEntry();
  const todayDate = scheduleService.getTodayDate();
  const formattedToday = formatDate(todayDate, { includeDayName: true });
  const upcomingEntries = scheduleService.getUpcomingEntries(6);
  const pastEntries = scheduleService.getPastEntries(4);
  const stats = scheduleService.getStatistics();

  let heroHtml = '';

  if (todayEntry) {
    const isCompleted = todayEntry.status === 'completed';
    const isPostponed = todayEntry.status === 'postponed';

    heroHtml = `
      <section class="today-hero ${isCompleted ? 'is-completed' : ''}" aria-labelledby="today-heading">
        <div class="today-hero-badge-strip">
          <span class="badge badge-hero-pulse">
            <span class="pulse-dot"></span>
            HARI INI
          </span>
          <span class="today-hero-date">${formattedToday}</span>
          <span class="badge badge-session">Putaran #${todayEntry.round || 1} • Sesi #${todayEntry.sessionNumber}</span>
          ${
            todayEntry.isCarryOver
              ? `<span class="badge badge-warning badge-sm" title="Siswa ini belum maju di putaran sebelumnya">⚠️ Carry-over Putaran #${todayEntry.carryOverFromRound}</span>`
              : ''
          }
        </div>

        <div class="today-hero-center">
          <div class="mic-icon-wrapper" aria-hidden="true">
            <span class="mic-icon">${isCompleted ? '🏆' : '🎤'}</span>
          </div>

          <h2 id="today-heading" class="today-speaker-name" title="${escapeHtml(todayEntry.student.name)}">
            ${escapeHtml(todayEntry.student.name)}
          </h2>

          <div class="today-status-container">
            ${renderStatusBadge(todayEntry.status)}
          </div>

          ${
            todayEntry.note
              ? `<div class="today-note-box">
                  <span class="note-icon" aria-hidden="true">📝</span>
                  <span class="note-text">${escapeHtml(todayEntry.note)}</span>
                </div>`
              : ''
          }
        </div>

        <div class="today-actions-bar">
          ${
            isCompleted
              ? `<button class="btn btn-hero btn-hero-revert" id="btn-revert-today" type="button">
                  <span class="btn-icon">↺</span> Batalkan Selesai
                </button>`
              : `<button class="btn btn-hero btn-hero-complete" id="btn-complete-today" type="button">
                  <span class="btn-icon">✓</span> Tandai Selesai
                </button>`
          }
          <button class="btn btn-hero btn-hero-postpone" id="btn-postpone-today" type="button" ${isCompleted ? 'disabled' : ''}>
            <span class="btn-icon">⏱</span> Tunda (Izin/Sakit)
          </button>
          <button class="btn btn-hero btn-hero-swap" id="btn-swap-today" type="button" ${isCompleted ? 'disabled' : ''}>
            <span class="btn-icon">⇄</span> Tukar Jadwal
          </button>
          <button class="btn btn-hero btn-hero-note" id="btn-note-today" type="button">
            <span class="btn-icon">✎</span> Catatan
          </button>
        </div>
      </section>
    `;
  } else {
    // No speaker scheduled today
    const nextSpeaker = upcomingEntries.length > 0 ? upcomingEntries[0] : null;

    heroHtml = `
      <section class="today-hero is-empty" aria-labelledby="today-heading">
        <div class="today-hero-badge-strip">
          <span class="badge badge-neutral">HARI INI</span>
          <span class="today-hero-date">${formattedToday}</span>
        </div>

        <div class="today-hero-center">
          <div class="empty-icon-wrapper" aria-hidden="true">
            <span class="empty-icon">☕</span>
          </div>

          <h2 id="today-heading" class="today-speaker-name empty-title">
            Tidak Ada Pembicara Hari Ini
          </h2>

          <p class="empty-subtitle">
            ${
              nextSpeaker
                ? `Pembicara berikutnya: <strong>${escapeHtml(nextSpeaker.student.name)}</strong> (${nextSpeaker.relativeDate.label})`
                : 'Belum ada sesi public speaking yang dijadwalkan.'
            }
          </p>
        </div>

        <div class="today-actions-bar">
          <button class="btn btn-primary" id="btn-go-schedule" type="button">
            📅 Lihat Jadwal Lengkap
          </button>
          <button class="btn btn-secondary" id="btn-add-today-slot" type="button">
            + Tambah Pembicara Hari Ini
          </button>
        </div>
      </section>
    `;
  }

  // Next Speakers HTML
  const upcomingHtml =
    upcomingEntries.length > 0
      ? `
        <div class="upcoming-list">
          ${upcomingEntries
            .map(entry => {
              return `
              <article class="upcoming-card" data-schedule-id="${entry.id}">
                <div class="upcoming-date-box">
                  <span class="upcoming-date-label">${entry.relativeDate.label}</span>
                  <span class="upcoming-session">#${entry.sessionNumber}</span>
                </div>
                <div class="upcoming-student-info">
                  <h4 class="upcoming-student-name">${escapeHtml(entry.student.name)}</h4>
                  ${entry.note ? `<span class="upcoming-note" title="${escapeHtml(entry.note)}">📝 ${escapeHtml(entry.note)}</span>` : ''}
                </div>
                <div class="upcoming-badge">
                  ${renderStatusBadge(entry.status, true)}
                </div>
                <div class="upcoming-card-actions">
                  <button class="btn-icon-subtle btn-swap-upcoming" data-id="${entry.id}" title="Tukar dengan hari ini/siswa lain" type="button" aria-label="Tukar jadwal ${escapeHtml(entry.student.name)}">
                    ⇄
                  </button>
                </div>
              </article>
            `;
            })
            .join('')}
        </div>
      `
      : `
        <div class="empty-box">
          <p>Semua sesi public speaking telah selesai atau belum dijadwalkan.</p>
        </div>
      `;

  // Past / Recent Speakers HTML
  const pastHtml =
    pastEntries.length > 0
      ? `
        <div class="past-list">
          ${pastEntries
            .map(entry => `
              <div class="past-item">
                <span class="past-check" aria-hidden="true">✓</span>
                <div class="past-info">
                  <strong class="past-name">${escapeHtml(entry.student.name)}</strong>
                  <span class="past-meta">Sesi #${entry.sessionNumber} • ${formatShortDate(entry.date, true)}</span>
                  ${entry.note ? `<span class="past-note">${escapeHtml(entry.note)}</span>` : ''}
                </div>
                <span class="badge badge-success">Selesai</span>
              </div>
            `)
            .join('')}
        </div>
      `
      : `
        <div class="empty-box">
          <p>Belum ada riwayat sesi selesai.</p>
        </div>
      `;

  container.innerHTML = `
    <div class="dashboard-container">
      ${heroHtml}

      <div class="dashboard-grid">
        <section class="dashboard-card" aria-labelledby="upcoming-heading">
          <div class="card-header">
            <div>
              <h3 id="upcoming-heading" class="card-title">🚀 Pembicara Selanjutnya</h3>
              <p class="card-subtitle">Jadwal giliran yang akan datang</p>
            </div>
            <button class="btn btn-subtle" id="btn-view-all-schedule" type="button">
              Lihat Semua (${stats.scheduledCount + stats.postponedCount}) →
            </button>
          </div>
          <div class="card-body">
            ${upcomingHtml}
          </div>
        </section>

        <section class="dashboard-card" aria-labelledby="recent-heading">
          <div class="card-header">
            <div>
              <h3 id="recent-heading" class="card-title">✓ Riwayat Sesi Terkini</h3>
              <p class="card-subtitle">Siswa yang telah menyelesaikan sesi (${stats.completedCount})</p>
            </div>
          </div>
          <div class="card-body">
            ${pastHtml}
          </div>
        </section>
      </div>
    </div>
  `;

  // Attach Event Handlers
  attachDashboardEvents(container, todayEntry);
}

function renderStatusBadge(status, isSmall = false) {
  const sizeClass = isSmall ? 'badge-sm' : 'badge-md';
  switch (status) {
    case 'completed':
      return `<span class="badge badge-success ${sizeClass}">✓ Selesai</span>`;
    case 'postponed':
      return `<span class="badge badge-warning ${sizeClass}">⏱ Ditunda</span>`;
    case 'skipped':
      return `<span class="badge badge-danger ${sizeClass}">⊘ Dilewati</span>`;
    case 'scheduled':
    default:
      return `<span class="badge badge-primary ${sizeClass}">📅 Dijadwalkan</span>`;
  }
}

function attachDashboardEvents(container, todayEntry) {
  // Mark Completed
  const completeBtn = container.querySelector('#btn-complete-today');
  if (completeBtn && todayEntry) {
    completeBtn.addEventListener('click', () => {
      scheduleService.completeEntry(todayEntry.id);
      showToast(`Hebat! Sesi ${todayEntry.student.name} ditandai selesai! 🎉`, 'success');
    });
  }

  // Revert Completed
  const revertBtn = container.querySelector('#btn-revert-today');
  if (revertBtn && todayEntry) {
    revertBtn.addEventListener('click', () => {
      scheduleService.revertEntry(todayEntry.id);
      showToast(`Status sesi ${todayEntry.student.name} dikembalikan ke dijadwalkan.`, 'info');
    });
  }

  // Postpone Today's speaker
  const postponeBtn = container.querySelector('#btn-postpone-today');
  if (postponeBtn && todayEntry) {
    postponeBtn.addEventListener('click', () => {
      openPostponeDialog(todayEntry);
    });
  }

  // Swap Today's speaker
  const swapBtn = container.querySelector('#btn-swap-today');
  if (swapBtn && todayEntry) {
    swapBtn.addEventListener('click', () => {
      openSwapDialog(todayEntry.id);
    });
  }

  // Note for today
  const noteBtn = container.querySelector('#btn-note-today');
  if (noteBtn && todayEntry) {
    noteBtn.addEventListener('click', () => {
      openNoteDialog(todayEntry);
    });
  }

  // Empty state buttons
  container.querySelector('#btn-go-schedule')?.addEventListener('click', () => {
    document.querySelector('[data-tab="schedule"]')?.click();
  });

  container.querySelector('#btn-view-all-schedule')?.addEventListener('click', () => {
    document.querySelector('[data-tab="schedule"]')?.click();
  });

  container.querySelector('#btn-add-today-slot')?.addEventListener('click', () => {
    document.querySelector('[data-tab="schedule"]')?.click();
  });

  // Upcoming items swap buttons
  container.querySelectorAll('.btn-swap-upcoming').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      openSwapDialog(id);
    });
  });
}

/**
 * Accessible Postpone Modal
 */
export function openPostponeDialog(entry) {
  let modal = document.getElementById('postpone-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'postpone-modal';
    modal.className = 'modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'postpone-title');
    document.body.appendChild(modal);
  }

  const isLast = scheduleService.isLastInRound(entry.id);
  const wasAlreadyPostponed = entry.status === 'postponed';
  const isSecondPostponement = isLast || wasAlreadyPostponed;
  const currentRound = entry.round || 1;
  const nextRound = currentRound + 1;

  modal.innerHTML = `
    <div class="modal-card animate-pop">
      <div class="modal-header">
        <h2 id="postpone-title" class="modal-title">
          ${isSecondPostponement ? '⚠️ Penundaan Lanjutan:' : '⏱ Tunda Giliran:'} ${escapeHtml(entry.student.name)}
        </h2>
        <button class="modal-close-btn" type="button" aria-label="Tutup dialog">×</button>
      </div>
      <form id="postpone-form" class="modal-body">
        <p class="modal-desc">
          ${
            isSecondPostponement
              ? `Siswa ini sudah berada di posisi paling akhir atau sebelumnya pernah ditunda pada <strong>Putaran #${currentRound}</strong>. Agar jadwal kelas tidak tersandera, pilih opsi penanganan berikut:`
              : 'Siswa sedang sakit atau berhalangan? Pindahkan giliran mereka dan sistem akan otomatis memajukan antrean siswa berikutnya.'
          }
        </p>

        <div class="form-group">
          <label for="postpone-target" class="form-label">Tindakan Lanjutan:</label>
          <select id="postpone-target" class="form-select" required>
            ${
              isSecondPostponement
                ? `
                <option value="carry_over" selected>➡️ Bawa ke Putaran #${nextRound} (Prioritas Pembuka #1) — Rekomendasi</option>
                <option value="skip">⊘ Tandai Dilewati (Gugur di Putaran #${currentRound})</option>
                <option value="next">🗓 Tambah 1 Hari Perpanjangan (Tukar dengan Besok)</option>
              `
                : `
                <option value="end" selected>Paling Akhir Putaran #${currentRound} (Rekomendasi)</option>
                <option value="next">Tukar dengan Hari Berikutnya</option>
                <option value="carry_over">Bawa Langsung ke Putaran #${nextRound}</option>
              `
            }
          </select>
        </div>

        <div class="form-group">
          <label for="postpone-reason" class="form-label">Alasan / Catatan:</label>
          <input
            type="text"
            id="postpone-reason"
            class="form-input"
            placeholder="Contoh: Izin sakit demam"
            value="${isSecondPostponement ? 'Belum bisa maju 2x' : 'Izin / Sakit'}"
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel-btn">Batal</button>
          <button type="submit" class="btn ${isSecondPostponement ? 'btn-danger' : 'btn-warning'}">
            Konfirmasi Tindakan
          </button>
        </div>
      </form>
    </div>
  `;

  const closeHandler = () => closeModal(modal);
  modal.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
  modal.querySelector('.modal-cancel-btn').addEventListener('click', closeHandler);

  modal.querySelector('#postpone-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const target = modal.querySelector('#postpone-target').value;
    const reason = modal.querySelector('#postpone-reason').value.trim();

    scheduleService.postponeEntry(entry.id, { target, reason });
    closeModal(modal);

    if (target === 'carry_over') {
      showToast(`Giliran ${entry.student.name} dialihkan sebagai Pembuka Putaran #${nextRound}! 🚀`, 'warning', 4000);
    } else if (target === 'skip') {
      showToast(`Sesi ${entry.student.name} ditandai dilewati di Putaran #${currentRound}.`, 'info');
    } else {
      showToast(`Giliran ${entry.student.name} berhasil ditunda. Jadwal otomatis diperbarui!`, 'warning');
    }
  });

  openModal(modal);
}

/**
 * Accessible Swap Modal
 */
export function openSwapDialog(currentScheduleId) {
  const schedule = scheduleService.getSortedSchedule();
  const currentItem = schedule.find(s => s.id === currentScheduleId);
  if (!currentItem) return;

  // Find other swap candidates (uncompleted upcoming items or today)
  const candidates = schedule.filter(s => s.id !== currentScheduleId && s.status !== 'completed');

  let modal = document.getElementById('swap-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'swap-modal';
    modal.className = 'modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'swap-title');
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card animate-pop">
      <div class="modal-header">
        <h2 id="swap-title" class="modal-title">⇄ Tukar Jadwal Siswa</h2>
        <button class="modal-close-btn" type="button" aria-label="Tutup dialog">×</button>
      </div>
      <form id="swap-form" class="modal-body">
        <p class="modal-desc">
          Tukar posisi tanggal antara <strong>${escapeHtml(currentItem.student.name)}</strong> (${formatShortDate(currentItem.date, true)}) dengan siswa lainnya:
        </p>

        <div class="form-group">
          <label for="swap-target-select" class="form-label">Pilih Siswa yang Ditukar:</label>
          <select id="swap-target-select" class="form-select" required>
            ${
              candidates.length === 0
                ? '<option value="">Tidak ada siswa lain yang tersedia untuk ditukar</option>'
                : candidates
                    .map(
                      c => `
                      <option value="${c.id}">
                        ${escapeHtml(c.student.name)} — ${formatShortDate(c.date, true)} (Sesi #${c.sessionNumber})
                      </option>
                    `
                    )
                    .join('')
            }
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary" ${candidates.length === 0 ? 'disabled' : ''}>
            Konfirmasi Tukar
          </button>
        </div>
      </form>
    </div>
  `;

  const closeHandler = () => closeModal(modal);
  modal.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
  modal.querySelector('.modal-cancel-btn').addEventListener('click', closeHandler);

  modal.querySelector('#swap-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const targetId = modal.querySelector('#swap-target-select').value;
    if (!targetId) return;

    const targetItem = schedule.find(s => s.id === targetId);
    scheduleService.swapEntries(currentScheduleId, targetId);
    closeModal(modal);
    showToast(`Berhasil menukar jadwal ${currentItem.student.name} dengan ${targetItem?.student?.name}!`, 'success');
  });

  openModal(modal);
}

/**
 * Accessible Note Modal
 */
export function openNoteDialog(entry) {
  let modal = document.getElementById('note-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'note-modal';
    modal.className = 'modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'note-title');
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card animate-pop">
      <div class="modal-header">
        <h2 id="note-title" class="modal-title">✎ Catatan Sesi: ${escapeHtml(entry.student.name)}</h2>
        <button class="modal-close-btn" type="button" aria-label="Tutup dialog">×</button>
      </div>
      <form id="note-form" class="modal-body">
        <div class="form-group">
          <label for="entry-note-input" class="form-label">Topik atau Catatan Khusus:</label>
          <textarea id="entry-note-input" class="form-textarea" rows="3" placeholder="Contoh: Topik presentasi tentang AI, atau permintaan khusus">${escapeHtml(entry.note || '')}</textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Catatan</button>
        </div>
      </form>
    </div>
  `;

  const closeHandler = () => closeModal(modal);
  modal.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
  modal.querySelector('.modal-cancel-btn').addEventListener('click', closeHandler);

  modal.querySelector('#note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const note = modal.querySelector('#entry-note-input').value.trim();
    scheduleService.updateEntry(entry.id, { note: note || null });
    closeModal(modal);
    showToast('Catatan sesi berhasil diperbarui.', 'success');
  });

  openModal(modal);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
