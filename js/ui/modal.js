/**
 * Accessible Modal and Dialog Manager with focus trapping and keyboard navigation.
 */

let activeModal = null;
let previousFocusedElement = null;

export function openModal(modalElement) {
  if (!modalElement) return;

  if (activeModal && activeModal !== modalElement) {
    closeModal(activeModal);
  }

  previousFocusedElement = document.activeElement;
  activeModal = modalElement;
  modalElement.classList.add('is-open');
  modalElement.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  // Focus the first focusable element or close button
  const focusable = getFocusableElements(modalElement);
  if (focusable.length > 0) {
    setTimeout(() => focusable[0].focus(), 50);
  }
}

export function closeModal(modalElement = activeModal) {
  if (!modalElement) return;

  modalElement.classList.remove('is-open');
  modalElement.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
    previousFocusedElement.focus();
  }

  if (activeModal === modalElement) {
    activeModal = null;
  }
}

export function getActiveModal() {
  return activeModal;
}

function getFocusableElements(container) {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector)).filter(
    el => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

// Global keyboard trap & escape listener
document.addEventListener('keydown', (e) => {
  if (!activeModal) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(activeModal);
    return;
  }

  if (e.key === 'Tab') {
    const focusable = getFocusableElements(activeModal);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Backdrop click listener
document.addEventListener('click', (e) => {
  if (activeModal && e.target.classList.contains('modal-backdrop')) {
    closeModal(activeModal);
  }
});

/**
 * Creates and shows an accessible confirmation dialog.
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog({
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  isDestructive = false
}) {
  return new Promise((resolve) => {
    let dialog = document.getElementById('app-confirm-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'app-confirm-dialog';
      dialog.className = 'modal-backdrop';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
      document.body.appendChild(dialog);
    }

    dialog.innerHTML = `
      <div class="modal-card modal-confirm animate-pop">
        <div class="modal-header">
          <h2 id="confirm-dialog-title" class="modal-title">${escapeHtml(title)}</h2>
          <button class="modal-close-btn" type="button" aria-label="Tutup dialog">×</button>
        </div>
        <div class="modal-body">
          <p class="confirm-message">${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-cancel" type="button">${escapeHtml(cancelText)}</button>
          <button class="btn ${isDestructive ? 'btn-danger' : 'btn-primary'} btn-confirm" type="button">
            ${escapeHtml(confirmText)}
          </button>
        </div>
      </div>
    `;

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      closeModal(dialog);
      dialog.querySelector('.btn-confirm')?.removeEventListener('click', handleConfirm);
      dialog.querySelector('.btn-cancel')?.removeEventListener('click', handleCancel);
      dialog.querySelector('.modal-close-btn')?.removeEventListener('click', handleCancel);
    };

    dialog.querySelector('.btn-confirm').addEventListener('click', handleConfirm);
    dialog.querySelector('.btn-cancel').addEventListener('click', handleCancel);
    dialog.querySelector('.modal-close-btn').addEventListener('click', handleCancel);

    openModal(dialog);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
