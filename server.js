// server.js
const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.get('*', (req,res) => res.sendFile(path.join(__dirname,'index.html')));

const server = app.listen(PORT, () => console.log(`Server avviato su porta ${PORT}`));
const wss = new WebSocket.Server({ server });

let players = [];

wss.on('connection', ws => {
  if(players.length >= 2){
    ws.send(JSON.stringify({type:'full', msg:'Partita piena'}));
    ws.close();
    return;
  }

  const color = players.length === 0 ? 'nim' : 'mor';
  players.push({ws,color});

  ws.send(JSON.stringify({type:'assignColor', color}));

  if(players.length === 2){
    players.forEach(p => p.ws.send(JSON.stringify({type:'startGame', msg:'Giocatori connessi!'})));
  } else {
    ws.send(JSON.stringify({type:'wait', msg:'In attesa che l’altro giocatore si connetta...'}));
  }

  ws.on('message', message => {
    players.forEach(p => {
      if(p.ws !== ws && p.ws.readyState === WebSocket.OPEN){
        p.ws.send(message);
      }
    });
  });

  ws.on('close', () => {
    players = players.filter(p => p.ws !== ws);
    players.forEach(p => {
      if(p.ws.readyState === WebSocket.OPEN){
        p.ws.send(JSON.stringify({type:'opponentLeft', msg:'Avversario disconnesso'}));
      }
    });
  });
});
