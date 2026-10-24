require('dotenv').config();
const express = require('express');
const app = require('./api/index');

const PORT = process.env.PORT || 3000;

// Serve file statis (HTML, CSS, JS) untuk pengujian lokal
app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`Local server running on http://localhost:${PORT}`);
});