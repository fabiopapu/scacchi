// app.js - Scacchi Fantasy Gandalf vs Sauron con WS
const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve file statici
app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Server
const server = app.listen(PORT, () => console.log(`Server avviato su porta ${PORT}`));

// WebSocket
const wss = new WebSocket.Server({ server });
let clients = [];

wss.on('connection', ws => {
  if (clients.length >= 2) {
    ws.send(JSON.stringify({ error: "Partita già completa" }));
    ws.close();
    return;
  }

  clients.push(ws);
  const color = clients.length === 1 ? 'nim' : 'mor';
  ws.send(JSON.stringify({ type: 'assignColor', color }));

  // Notifica quando entrambi i giocatori sono connessi
  if (clients.length === 2) {
    clients.forEach(c => {
      if (c.readyState === WebSocket.OPEN)
        c.send(JSON.stringify({ type: 'bothConnected' }));
    });
  }

  ws.on('message', message => {
    // Invia la mossa all'altro giocatore
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN)
        client.send(JSON.stringify({ type: 'opponentLeft' }));
    });
  });
});

