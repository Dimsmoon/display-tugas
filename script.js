const API_URL = '/api/tasks';

const taskForm = document.getElementById('task-form');
const taskIdInput = document.getElementById('task-id');
const titleInput = document.getElementById('title');
const courseInput = document.getElementById('course');
const descriptionInput = document.getElementById('description');
const fileInput = document.getElementById('file');
const fileInputContainer = document.getElementById('file-input-container');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const taskList = document.getElementById('task-list');

// Dropzone & Modal Elemen
const fileNameText = document.getElementById('file-name-text');
const fileSubText = document.getElementById('file-sub-text');
const dropzoneBox = document.getElementById('dropzone-box');

const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

const previewModal = document.getElementById('preview-modal');
const previewTitle = document.getElementById('preview-title');
const previewBody = document.getElementById('preview-body');
const closePreviewBtn = document.getElementById('close-preview-btn');

let tasksData = [];
let targetDeleteId = null;

// 1. Skeleton Loader Saat Loading
function renderSkeleton() {
  if (!taskList) return;
  taskList.innerHTML = Array(4).fill(0).map(() => `
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 animate-pulse flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div class="h-4 w-12 bg-slate-100 dark:bg-slate-700/50 rounded"></div>
        </div>
        <div class="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
        <div class="h-4 w-full bg-slate-100 dark:bg-slate-700/50 rounded mb-1"></div>
        <div class="h-4 w-2/3 bg-slate-100 dark:bg-slate-700/50 rounded"></div>
      </div>
      <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div class="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div class="h-4 w-16 bg-slate-100 dark:bg-slate-700/50 rounded"></div>
      </div>
    </div>
  `).join('');
}

// Helper Ikon File Berdasarkan Ekstensi
function getFileIcon(url) {
  if (!url) return '';
  const ext = url.split('.').pop().split('?')[0].toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return `<svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return `<svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>`;
  }
  if (['doc', 'docx'].includes(ext)) {
    return `<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`;
  }
  return `<svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>`;
}

// 2. Fetch Tasks
async function fetchTasks() {
  renderSkeleton();
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Gagal mengambil data dari server');
    
    tasksData = await res.json();
    taskList.innerHTML = '';

    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      taskList.innerHTML = `<p class="text-slate-400 col-span-2 text-center py-8 text-sm">Belum ada tugas yang diunggah.</p>`;
      return;
    }

    tasksData.forEach((task) => {
      const card = document.createElement('div');
      card.className = 'group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-2 mb-3">
            <span class="inline-block text-[11px] font-bold tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1 rounded-lg uppercase">
              ${escapeHtml(task.course)}
            </span>
            <span class="text-[11px] text-slate-400">
              ${new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
            ${escapeHtml(task.title)}
          </h3>
          <p class="text-slate-500 dark:text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
            ${escapeHtml(task.description || 'Tidak ada deskripsi tambahan.')}
          </p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button onclick="previewFile('${task.file_url}', '${escapeHtml(task.title)}')" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer">
              ${getFileIcon(task.file_url)}
              Preview
            </button>
            <a href="${task.file_url}" target="_blank" rel="noopener noreferrer" download class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1.5">
              📥 Unduh
            </a>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="handleEdit(${task.id})" class="text-slate-400 hover:text-amber-600 text-xs font-medium transition cursor-pointer">Edit</button>
            <button onclick="handleDelete(${task.id})" class="text-slate-400 hover:text-rose-600 text-xs font-medium transition cursor-pointer">Hapus</button>
          </div>
        </div>
      `;
      taskList.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    taskList.innerHTML = `<p class="text-rose-500 col-span-2 text-center py-4 text-sm">Gagal memuat data tugas.</p>`;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 3. Submit Form
const warningModal = document.getElementById('warning-modal');
const warningMessage = document.getElementById('warning-message');
const closeWarningBtn = document.getElementById('close-warning-btn');

// Helper untuk menampilkan Modal Warning Kustom
function showWarning(message) {
  if (warningModal && warningMessage) {
    warningMessage.textContent = message;
    warningModal.classList.remove('opacity-0', 'pointer-events-none');
  } else {
    alert(message);
  }
}

// Event Listener Tutup Modal Warning
if (closeWarningBtn) {
  closeWarningBtn.addEventListener('click', () => {
    if (warningModal) warningModal.classList.add('opacity-0', 'pointer-events-none');
  });
}

// --- SUBMIT FORM TUGAS ---
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  try {
    const id = taskIdInput.value;
    if (id) {
      // Mode EDIT
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleInput.value,
          course: courseInput.value,
          description: descriptionInput.value
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal memperbarui metadata tugas.');
      }
    } else {
      // Mode UPLOAD BARU
      if (!fileInput.files[0]) {
        showWarning('Pilih file tugas terlebih dahulu!');
        resetSubmitButton();
        return;
      }

      const formData = new FormData();
      formData.append('title', titleInput.value);
      formData.append('course', courseInput.value);
      formData.append('description', descriptionInput.value);
      formData.append('file', fileInput.files[0]);

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          // Menampilkan pesan error khusus (termasuk file duplikat)
          throw new Error(errorData.error || 'Gagal mengunggah file');
        } else {
          throw new Error('Ukuran file terlalu besar untuk diproses server (Maksimal 4 MB).');
        }
      }
    }

    resetForm();
    await fetchTasks();
  } catch (err) {
    showWarning(err.message);
    console.error(err);
  } finally {
    resetSubmitButton();
  }
});

// Helper untuk mengembalikan state tombol submit
function resetSubmitButton() {
  submitBtn.disabled = false;
  submitBtn.textContent = taskIdInput.value ? 'Simpan Perubahan' : 'Unggah Tugas';
}

// 4. Modal Preview Handler
window.previewFile = (url, title) => {
  if (!previewModal || !previewTitle || !previewBody) return;

  previewTitle.textContent = `Preview: ${title}`;
  previewBody.innerHTML = '';

  const ext = url.split('.').pop().split('?')[0].toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    previewBody.innerHTML = `<img src="${url}" alt="Preview" class="max-h-full max-w-full object-contain rounded-lg shadow-md">`;
  } else if (ext === 'pdf') {
    previewBody.innerHTML = `<iframe src="${url}" class="w-full h-full rounded-lg" frameborder="0"></iframe>`;
  } else {
    previewBody.innerHTML = `
      <div class="text-center p-6">
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">Format file (.${ext}) tidak mendukung preview langsung.</p>
        <a href="${url}" target="_blank" download class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition">📥 Unduh File</a>
      </div>
    `;
  }

  previewModal.classList.remove('opacity-0', 'pointer-events-none');
};

if (closePreviewBtn) {
  closePreviewBtn.addEventListener('click', () => {
    if (previewModal) previewModal.classList.add('opacity-0', 'pointer-events-none');
    if (previewBody) previewBody.innerHTML = '';
  });
}

// 5. Modal Hapus Handler
window.handleDelete = (id) => {
  targetDeleteId = id;
  if (deleteModal) deleteModal.classList.remove('opacity-0', 'pointer-events-none');
};

if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

function closeDeleteModal() {
  targetDeleteId = null;
  if (deleteModal) deleteModal.classList.add('opacity-0', 'pointer-events-none');
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!targetDeleteId) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Menghapus...';

    try {
      const res = await fetch(`${API_URL}/${targetDeleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus tugas');
      closeDeleteModal();
      await fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Ya, Hapus';
    }
  });
}

// Edit & Form Reset Logic
window.handleEdit = (id) => {
  const task = tasksData.find((t) => t.id === id);
  if (!task) return;

  taskIdInput.value = task.id;
  titleInput.value = task.title;
  courseInput.value = task.course;
  descriptionInput.value = task.description || '';

  formTitle.textContent = 'Edit Metadata Tugas';
  submitBtn.textContent = 'Simpan Perubahan';
  cancelBtn.classList.remove('hidden');
  fileInputContainer.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  taskForm.reset();
  taskIdInput.value = '';
  formTitle.textContent = 'Unggah Tugas Baru';
  submitBtn.textContent = 'Unggah Tugas';
  cancelBtn.classList.add('hidden');
  fileInputContainer.classList.remove('hidden');
  resetDropzoneUI();
}

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      const MAX_SIZE = 4 * 1024 * 1024; // 4 MB dalam bytes
      
      if (selectedFile.size > MAX_SIZE) {
        // Ganti alert bawaan dengan modal warning kustom
        showWarning('Ukuran file terlalu besar! Maksimal ukuran file adalah 4 MB.');
        fileInput.value = ''; // Reset pilihan file
        resetDropzoneUI();
        return;
      }

      if (fileNameText) {
        fileNameText.textContent = `📄 ${selectedFile.name}`;
        fileNameText.classList.add('text-indigo-600', 'dark:text-indigo-400', 'font-bold');
      }
      if (fileSubText) {
        fileSubText.textContent = `Ukuran: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`;
      }
      if (dropzoneBox) {
        dropzoneBox.classList.remove('border-slate-200', 'dark:border-slate-700', 'bg-slate-50/50');
        dropzoneBox.classList.add('border-indigo-400', 'bg-indigo-50/40', 'dark:bg-indigo-950/30');
      }
    } else {
      resetDropzoneUI();
    }
  });
}

function resetDropzoneUI() {
  if (fileNameText) {
    fileNameText.textContent = 'Klik untuk memilih file dokumen';
    fileNameText.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'font-bold');
  }
  if (fileSubText) {
    fileSubText.textContent = 'Mendukung PDF, DOCX, ZIP, PNG, dll. (Maks 4 MB)';
  }
  if (dropzoneBox) {
    dropzoneBox.classList.remove('border-indigo-400', 'bg-indigo-50/40', 'dark:bg-indigo-950/30');
    dropzoneBox.classList.add('border-slate-200', 'dark:border-slate-700', 'bg-slate-50/50');
  }
}

// 6. Dark Mode Toggle Button Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('theme-toggle-dark-icon');
const lightIcon = document.getElementById('theme-toggle-light-icon');
const themeText = document.getElementById('theme-text');

function updateThemeUI() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    if (darkIcon) darkIcon.classList.add('hidden');
    if (lightIcon) lightIcon.classList.remove('hidden');
    if (themeText) themeText.textContent = 'Mode Terang';
  } else {
    if (darkIcon) darkIcon.classList.remove('hidden');
    if (lightIcon) lightIcon.classList.add('hidden');
    if (themeText) themeText.textContent = 'Mode Gelap';
  }
}

if (themeToggleBtn) {
  updateThemeUI();

  themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeUI();
  });
}

// Load awal
fetchTasks();