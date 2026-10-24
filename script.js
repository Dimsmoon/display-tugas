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
      card.className = 'bg-white p-5 rounded-lg shadow border flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <span class="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">${escapeHtml(task.course)}</span>
          <h3 class="text-lg font-bold text-gray-800 mt-2">${escapeHtml(task.title)}</h3>
          <p class="text-gray-600 text-sm mt-1">${escapeHtml(task.description || 'Tidak ada deskripsi.')}</p>
        </div>
        <div class="mt-4 pt-3 border-t flex items-center justify-between">
          <a href="${task.file_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium text-sm hover:underline flex items-center gap-1">
            📥 Unduh File
          </a>
          <div class="space-x-2">
            <button onclick="handleEdit(${task.id})" class="text-amber-600 text-sm hover:underline font-medium">Edit</button>
            <button onclick="handleDelete(${task.id})" class="text-red-600 text-sm hover:underline font-medium">Hapus</button>
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal mengunggah file');
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
window.handleDelete = async (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus tugas ini beserta filenya?')) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus tugas');
      await fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  }
};

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