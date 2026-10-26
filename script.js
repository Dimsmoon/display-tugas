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

// Array lokal untuk menyimpan data tugas
let tasksData = [];

// 1. Fetch & Tampilkan Semua Tugas
async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Gagal mengambil data dari server');
    
    tasksData = await res.json();
    taskList.innerHTML = '';

    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      taskList.innerHTML = `<p class="text-gray-500 col-span-2 text-center py-4">Belum ada tugas yang diunggah.</p>`;
      return;
    }

    tasksData.forEach((task) => {
          const card = document.createElement('div');
          card.className = 'group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between';
          card.innerHTML = `
            <div>
              <div class="flex items-start justify-between gap-2 mb-3">
                <span class="inline-block text-[11px] font-bold tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2.5 py-1 rounded-lg uppercase">
                  ${escapeHtml(task.course)}
                </span>
                <span class="text-[11px] text-slate-400">
                  ${new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <h3 class="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition line-clamp-1">
                ${escapeHtml(task.title)}
              </h3>
              <p class="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                ${escapeHtml(task.description || 'Tidak ada deskripsi tambahan.')}
              </p>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <a href="${task.file_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Unduh Berkas
              </a>
              <div class="flex items-center gap-3">
                <button onclick="handleEdit(${task.id})" class="text-slate-400 hover:text-amber-600 text-xs font-medium transition">Edit</button>
                <button onclick="handleDelete(${task.id})" class="text-slate-400 hover:text-rose-600 text-xs font-medium transition">Hapus</button>
              </div>
            </div>
          `;
          taskList.appendChild(card);
        });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    taskList.innerHTML = `<p class="text-red-500 col-span-2 text-center py-4">Gagal memuat data tugas.</p>`;
  }
}

// Helper sanitasi teks
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 2. Submit Form (Tambah / Edit)
// 2. Submit Form (Tambah / Edit)
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  try {
    const id = taskIdInput.value;
    if (id) {
      // Mode EDIT
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleInput.value,
          course: courseInput.value,
          description: descriptionInput.value
        })
      });
    } else {
      // Mode UPLOAD BARU
      if (!fileInput.files[0]) {
        alert('Pilih file tugas terlebih dahulu!');
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

      // Cek apakah response berupa JSON yang valid
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal mengunggah file');
        } else {
          // Tangani jika Vercel mengembalikan teks biasa/HTML (misal: Payload Too Large)
          throw new Error('Ukuran file terlalu besar untuk diproses server (Maksimal 4 MB).');
        }
      }
    }

    resetForm();
    await fetchTasks();
  } catch (err) {
    alert(`Terjadi kesalahan: ${err.message}`);
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});

// 3. Fungsi Edit
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

// 4. Fungsi Hapus
// Elemen UI Modal Hapus
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
let targetDeleteId = null;

// Override fungsi handleDelete bawaan
window.handleDelete = (id) => {
  targetDeleteId = id;
  // Tampilkan Modal dengan animasi lembut
  deleteModal.classList.remove('opacity-0', 'pointer-events-none');
};

// Tombol Batal pada Modal
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

function closeDeleteModal() {
  targetDeleteId = null;
  deleteModal.classList.add('opacity-0', 'pointer-events-none');
}

// Eksekusi Hapus saat tombol "Ya, Hapus" diklik
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

// Reset Form
cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  taskForm.reset();
  taskIdInput.value = '';
  formTitle.textContent = 'Unggah Tugas Baru';
  submitBtn.textContent = 'Unggah Tugas';
  cancelBtn.classList.add('hidden');
  fileInputContainer.classList.remove('hidden');
}

// Muat data saat halaman pertama dibuka
fetchTasks();

// Elemen UI Dropzone File
const fileNameText = document.getElementById('file-name-text');
const fileSubText = document.getElementById('file-sub-text');
const dropzoneBox = document.getElementById('dropzone-box');

// Deteksi saat pengguna memilih file
fileInput.addEventListener('change', (e) => {
  const selectedFile = e.target.files[0];

  if (selectedFile) {
    // Batas 4MB (4 * 1024 * 1024 bytes)
    const MAX_SIZE = 4 * 1024 * 1024; 
    
    if (selectedFile.size > MAX_SIZE) {
      alert('Ukuran file terlalu besar! Maksimal ukuran file adalah 4 MB.');
      fileInput.value = ''; // Reset pilihan file
      resetDropzoneUI();
      return;
    }

    fileNameText.textContent = `📄 ${selectedFile.name}`;
    fileNameText.classList.add('text-indigo-600', 'font-bold');
    fileSubText.textContent = `Ukuran: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`;
    
    dropzoneBox.classList.remove('border-slate-200', 'bg-slate-50/50');
    dropzoneBox.classList.add('border-indigo-400', 'bg-indigo-50/40');
  } else {
    resetDropzoneUI();
  }
});

// Update fungsi resetForm agar tampilan dropzone kembali semula setelah upload/batal
const originalResetForm = resetForm;
resetForm = function() {
  originalResetForm();
  resetDropzoneUI();
};

function resetDropzoneUI() {
  fileNameText.textContent = 'Klik untuk memilih file dokumen';
  fileNameText.classList.remove('text-indigo-600', 'font-bold');
  fileSubText.textContent = 'Mendukung PDF, DOCX, ZIP, PNG, dll.';
  
  dropzoneBox.classList.remove('border-indigo-400', 'bg-indigo-50/40');
  dropzoneBox.classList.add('border-slate-200', 'bg-slate-50/50');
}