const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint sederhana untuk tes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is Working' });
});

app.listen(PORT, () => {
  console.log(`Server Work in http://localhost:${PORT}`);
});