/**
 * Students Directory Component.
 * Supports adding, editing, archiving, and safe removal of students.
 */
import { store } from '../core/store.js';
import { scheduleService } from '../services/schedule-service.js';
import { formatShortDate } from '../utils/date.js';
import { showToast } from './toast.js';
import { showConfirmDialog, openModal, closeModal } from './modal.js';

let studentSearch = '';

export function renderStudents(container) {
  const state = store.getState();
  const schedule = scheduleService.getSortedSchedule();
  const today = scheduleService.getTodayDate();

  // Calculate statistics per student
  const studentStats = state.students.map(student => {
    const studentSessions = schedule.filter(s => s.studentId === student.id);
    const completedCount = studentSessions.filter(s => s.status === 'completed').length;
    const nextSession = studentSessions.find(s => s.status !== 'completed' && s.date >= today);
    const lastSession = [...studentSessions]
      .filter(s => s.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const debtItem = studentSessions.find(s => s.isCarryOver);
    const debtRound = debtItem ? debtItem.carryOverFromRound : null;

    return {
      ...student,
      completedCount,
      totalSessions: studentSessions.length,
      nextSession,
      lastSession,
      debtRound
    };
  });

  const filteredStudents = studentStats.filter(s => {
    if (!studentSearch.trim()) return true;
    return s.name.toLowerCase().includes(studentSearch.toLowerCase().trim());
  });

  const activeCount = state.students.filter(s => s.active).length;
  const archivedCount = state.students.filter(s => !s.active).length;

  container.innerHTML = `
    <div class="students-view-container">
      <div class="schedule-toolbar">
        <div class="toolbar-left">
          <h2 class="section-title">👥 Daftar Anggota Kelas</h2>
          <p class="section-desc">Total ${activeCount} siswa aktif ${archivedCount > 0 ? `(${archivedCount} diarsipkan)` : ''}.</p>
        </div>
        <div class="toolbar-actions">
          <button class="btn btn-primary" id="btn-add-student-modal" type="button">
            + Tambah Siswa Baru
          </button>
        </div>
      </div>

      <div class="schedule-controls-bar">
        <div class="search-box">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="student-search-input"
            class="search-input"
            placeholder="Cari nama siswa..."
            value="${escapeHtml(studentSearch)}"
            aria-label="Cari siswa"
          />
          ${
            studentSearch
              ? `<button class="search-clear-btn" id="btn-clear-student-search" type="button" aria-label="Hapus pencarian">×</button>`
              : ''
          }
        </div>
      </div>

      <div class="students-grid">
        ${
          filteredStudents.length === 0
            ? `
            <div class="empty-state-box">
              <span class="empty-state-icon">👤</span>
              <h3 class="empty-state-title">Tidak ada siswa ditemukan</h3>
              <p class="empty-state-text">
                ${
                  studentSearch
                    ? `Tidak ada siswa dengan nama "${escapeHtml(studentSearch)}".`
                    : 'Belum ada data siswa di kelas ini.'
                }
              </p>
              <button class="btn btn-primary" id="btn-empty-add-student" type="button">+ Tambah Siswa Sekarang</button>
            </div>
          `
            : filteredStudents
                .map(s => renderStudentCard(s))
                .join('')
        }
      </div>
    </div>
  `;

  attachStudentsEvents(container);
}

function renderStudentCard(student) {
  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  return `
    <article class="student-card ${!student.active ? 'is-archived' : ''}" data-student-id="${student.id}">
      <div class="student-card-header">
        <div class="student-avatar" aria-hidden="true">${initials}</div>
        <div class="student-meta">
          <h3 class="student-card-name">${escapeHtml(student.name)}</h3>
          <span class="badge ${student.active ? 'badge-neutral' : 'badge-danger'} badge-sm">
            ${student.active ? 'Siswa Aktif' : 'Diarsipkan'}
          </span>
        </div>
      </div>

      <div class="student-card-body">
        <div class="student-stat-row">
          <span class="stat-label">Sesi Selesai:</span>
          <span class="stat-val font-bold text-success">${student.completedCount} kali</span>
        </div>
        <div class="student-stat-row">
          <span class="stat-label">Jadwal Berikutnya:</span>
          <span class="stat-val">
            ${
              student.nextSession
                ? `<strong>${formatShortDate(student.nextSession.date, true)}</strong> (Putaran #${student.nextSession.round || 1})`
                : '<span class="text-muted">Belum dijadwalkan</span>'
            }
          </span>
        </div>
        ${
          student.debtRound
            ? `
            <div class="student-stat-row" style="background: rgba(245, 158, 11, 0.1); padding: 4px 6px; border-radius: 4px; margin-top: 4px;">
              <span class="stat-label text-warning font-bold">Status:</span>
              <span class="stat-val text-warning font-bold">⚠️ Carry-over Putaran #${student.debtRound}</span>
            </div>
          `
            : ''
        }
      </div>

      <div class="student-card-footer">
        <button class="btn-subtle btn-edit-student" data-id="${student.id}" type="button">
          ✎ Edit
        </button>
        ${
          student.active
            ? `
            <button class="btn-subtle btn-archive-student" data-id="${student.id}" type="button" title="Arsipkan siswa ini">
              Arsipkan
            </button>
          `
            : `
            <button class="btn-subtle btn-restore-student" data-id="${student.id}" type="button" title="Aktifkan kembali siswa ini">
              Aktifkan
            </button>
          `
        }
        <button class="btn-subtle text-danger btn-delete-student" data-id="${student.id}" type="button" title="Hapus permanen jika tidak ada riwayat">
          Hapus
        </button>
      </div>
    </article>
  `;
}

function attachStudentsEvents(container) {
  // Search
  const searchInput = container.querySelector('#student-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      studentSearch = e.target.value;
      renderStudents(container);
      const newSearch = container.querySelector('#student-search-input');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(studentSearch.length, studentSearch.length);
      }
    });
  }

  container.querySelector('#btn-clear-student-search')?.addEventListener('click', () => {
    studentSearch = '';
    renderStudents(container);
  });

  // Add student
  const openAdd = () => openStudentModal();
  container.querySelector('#btn-add-student-modal')?.addEventListener('click', openAdd);
  container.querySelector('#btn-empty-add-student')?.addEventListener('click', openAdd);

  // Edit student
  container.querySelectorAll('.btn-edit-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const student = store.getState().students.find(s => s.id === id);
      if (student) openStudentModal(student);
    });
  });

  // Archive student
  container.querySelectorAll('.btn-archive-student').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const student = store.getState().students.find(s => s.id === id);
      if (!student) return;

      const confirmed = await showConfirmDialog({
        title: 'Arsipkan Siswa?',
        message: `Arsipkan ${student.name}? Riwayat sesi yang sudah selesai tetap disimpan, namun jadwal yang akan datang akan dihapus dan antrean dimajukan.`,
        confirmText: 'Ya, Arsipkan',
        cancelText: 'Batal',
        isDestructive: false
      });

      if (confirmed) {
        scheduleService.archiveStudent(id);
        showToast(`Siswa "${student.name}" berhasil diarsipkan.`, 'info');
      }
    });
  });

  // Restore student
  container.querySelectorAll('.btn-restore-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      scheduleService.updateStudent(id, { active: true });
      showToast('Siswa berhasil diaktifkan kembali.', 'success');
    });
  });

  // Delete student
  container.querySelectorAll('.btn-delete-student').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const student = store.getState().students.find(s => s.id === id);
      if (!student) return;

      try {
        const confirmed = await showConfirmDialog({
          title: 'Hapus Siswa Permanen?',
          message: `Hapus ${student.name} dari sistem? Tindakan ini tidak dapat dibatalkan.`,
          confirmText: 'Hapus Permanen',
          cancelText: 'Batal',
          isDestructive: true
        });

        if (confirmed) {
          scheduleService.deleteStudent(id);
          showToast(`Siswa "${student.name}" berhasil dihapus.`, 'info');
        }
      } catch (err) {
        showToast(err.message, 'warning');
      }
    });
  });
}

function openStudentModal(existingStudent = null) {
  const isEditing = Boolean(existingStudent);
  let modal = document.getElementById('student-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-modal';
    modal.className = 'modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'student-modal-title');
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card animate-pop">
      <div class="modal-header">
        <h2 id="student-modal-title" class="modal-title">
          ${isEditing ? '✎ Edit Data Siswa' : '+ Daftarkan Siswa Baru'}
        </h2>
        <button class="modal-close-btn" type="button" aria-label="Tutup dialog">×</button>
      </div>
      <form id="student-form" class="modal-body">
        <div class="form-group">
          <label for="student-name-input" class="form-label">Nama Lengkap Siswa:</label>
          <input
            type="text"
            id="student-name-input"
            class="form-input"
            placeholder="Contoh: Muhammad Farhan"
            value="${escapeHtml(existingStudent ? existingStudent.name : '')}"
            required
            autocomplete="off"
          />
        </div>

        ${
          !isEditing
            ? `
            <div class="form-group">
              <label class="form-checkbox-label">
                <input type="checkbox" id="add-to-schedule-check" checked />
                <span>Otomatis tambahkan ke slot jadwal mendatang berikutnya</span>
              </label>
            </div>
          `
            : ''
        }

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">
            ${isEditing ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
          </button>
        </div>
      </form>
    </div>
  `;

  const closeHandler = () => closeModal(modal);
  modal.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
  modal.querySelector('.modal-cancel-btn').addEventListener('click', closeHandler);

  modal.querySelector('#student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modal.querySelector('#student-name-input').value.trim();
    if (!name) {
      showToast('Nama siswa wajib diisi.', 'warning');
      return;
    }

    if (isEditing) {
      scheduleService.updateStudent(existingStudent.id, { name });
      closeModal(modal);
      showToast('Data siswa berhasil diperbarui.', 'success');
    } else {
      const addToSchedule = modal.querySelector('#add-to-schedule-check').checked;
      scheduleService.addStudent({ name }, addToSchedule);
      closeModal(modal);
      showToast(`Siswa "${name}" berhasil ditambahkan!`, 'success');
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
