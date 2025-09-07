const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servi la cartella ribillen-web come statica
app.use(express.static(__dirname));

// Tutte le richieste puntano a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server avviato su porta ${PORT}`));
