require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const supabase = require('../supabase');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Middleware Validasi Admin PIN
const verifyAdminPin = (req, res, next) => {
  const adminPin = req.headers['x-admin-pin'];
  if (!adminPin || adminPin !== process.env.ADMIN_PIN) {
    return res.status(403).json({ error: 'Akses ditolak! PIN Admin tidak valid.' });
  }
  next();
};

// Endpoint Verifikasi Admin PIN
app.post('/api/admin/verify', (req, res) => {
  const { pin } = req.body;
  const serverPin = process.env.ADMIN_PIN;

  if (!pin || String(pin).trim() !== String(serverPin).trim()) {
    return res.status(401).json({ error: 'PIN Admin salah! Akses ditolak.' });
  }

  res.json({ success: true, message: 'PIN Valid' });
});

// 1. READ (Bisa diakses Publik/Semua Orang)
app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 2. CREATE (Wajib Admin PIN)
app.post('/api/tasks', verifyAdminPin, upload.single('file'), async (req, res) => {
  try {
    const { title, course, description } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File wajib diunggah!' });

    // Cek File Duplikat
    const { data: existingTasks, error: checkError } = await supabase
      .from('tasks')
      .select('id, file_path')
      .ilike('file_path', `%-${file.originalname}`);

    if (checkError) throw checkError;

    if (existingTasks && existingTasks.length > 0) {
      return res.status(400).json({
        error: `File "${file.originalname}" sudah pernah diunggah sebelumnya. Gunakan nama file lain!`
      });
    }

    const fileName = `${Date.now()}-${file.originalname}`;

    const { error: storageError } = await supabase.storage
      .from('task-files')
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage
      .from('task-files')
      .getPublicUrl(fileName);

    const { data, error: dbError } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          course,
          description,
          file_url: urlData.publicUrl,
          file_path: fileName
        }
      ])
      .select();

    if (dbError) throw dbError;

    res.status(201).json({ message: 'Tugas berhasil diunggah!', task: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. UPDATE (Wajib Admin PIN)
app.put('/api/tasks/:id', verifyAdminPin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, course, description } = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update({ title, course, description })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ message: 'Tugas berhasil diperbarui!', task: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE (Wajib Admin PIN)
app.delete('/api/tasks/:id', verifyAdminPin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

    await supabase.storage.from('task-files').remove([task.file_path]);

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Tugas dan file berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;