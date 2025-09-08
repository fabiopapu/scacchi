// index.js - Server Scacchi Fantasy con WebSocket
const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve tutti i file statici (HTML, CSS, JS)
app.use(express.static(__dirname));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, () => console.log(`Server avviato su porta ${PORT}`));

// --- WebSocket ---
const wss = new WebSocket.Server({ server });
let clients = [];

wss.on('connection', ws => {
  // Limitiamo a due giocatori
  if(clients.length >= 2){
    ws.send(JSON.stringify({type:'full', msg:"Partita già piena"}));
    ws.close();
    return;
  }

  clients.push(ws);
  const color = clients.length === 1 ? 'nim' : 'mor';
  ws.send(JSON.stringify({type:'assignColor', color}));

  // Se entrambi i giocatori sono connessi, notifichiamo entrambi
  if(clients.length === 2){
    clients.forEach(client => {
      if(client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify({type:'bothConnected'}));
      }
    });
  } else {
    // Se solo uno, avvisa di attendere
    ws.send(JSON.stringify({type:'wait', msg:"In attesa dell'avversario..."}));
  }

  // Gestione messaggi
  ws.on('message', message => {
    let data;
    try { data = JSON.parse(message); } catch(e){ return; }

    if(data.type === 'move'){
      // Invia la mossa all'altro giocatore
      clients.forEach(client => {
        if(client !== ws && client.readyState === WebSocket.OPEN){
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on('close', () => {
    // Rimuovo il client chiuso
    clients = clients.filter(c => c !== ws);

    // Notifico l'altro giocatore se presente
    clients.forEach(client => {
      if(client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify({type:'opponentLeft'}));
      }
    });
  });
});
