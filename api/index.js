require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const supabase = require('../supabase'); // Note: path ke supabase.js naik 1 folder

const app = express();

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// 1. READ
app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 2. CREATE
app.post('/api/tasks', upload.single('file'), async (req, res) => {
  try {
    const { title, course, description } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File wajib diunggah!' });

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

// 3. UPDATE
app.put('/api/tasks/:id', async (req, res) => {
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

// 4. DELETE
app.delete('/api/tasks/:id', async (req, res) => {
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

// Export app agar dibaca oleh Vercel Serverless Function
module.exports = app;