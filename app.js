// PeerJS setup
let peer = new Peer();
let conn = null;
let color = null;
let board_state = [];
let selected = null;
let turn = 'nim';

const setupDiv = document.getElementById("setup");
const info = document.getElementById("info");
const connectBtn = document.getElementById("connect-btn");
const peerInput = document.getElementById("peer-id");

// Scacchiera iniziale
board_state = [
["mor_rook","mor_knight","mor_specter","mor_queen","mor_king","mor_specter","mor_knight","mor_rook"],
["mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn"],
["","","","","","","",""],
["","","","","","","",""],
["","","","","","","",""],
["","","","","","","",""],
["nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn"],
["nim_rook","nim_knight","nim_elf","nim_queen","nim_king","nim_elf","nim_knight","nim_rook"]
];

const pieces = {
  nim: { king:"🧙‍♂️", queen:"♕", rook:"♖", elf:"🧝", knight:"♘", pawn:"♙" },
  mor: { king:"👁️", queen:"♛", rook:"♜", specter:"👤", knight:"♞", pawn:"♟" }
};

// Render scacchiera
function renderBoard(){
  const board = document.getElementById("board");
  board.innerHTML='';
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const cell=document.createElement("div");
      cell.className="cell "+((r+c)%2===0?"light":"dark");
      cell.dataset.row=r;
      cell.dataset.col=c;
      let code=board_state[r][c];
      if(code){
        const span=document.createElement("span");
        let [col,type]=code.split("_");
        span.textContent=pieces[col][type];
        span.className="piece "+(col==='nim'?'white-emoji':'mor');
        if(type==='specter') span.className="piece specter mor";
        if(type==='king' && col==='mor') span.className="piece sauron mor";
        cell.appendChild(span);
      }
      cell.addEventListener('click',()=>onCellClick(r,c));
      board.appendChild(cell);
    }
  }
  info.textContent="Tu sei "+color.toUpperCase()+". Turno: "+turn.toUpperCase();
}

// Click su cella
function onCellClick(r,c){
  if(color!==turn) return;
  if(selected){
    makeMove(selected.r,selected.c,r,c);
    selected=null;
  } else {
    if(board_state[r][c] && board_state[r][c].startsWith(color)) selected={r,c};
  }
}

// Logica mosse base
function isMoveLegal(r1,c1,r2,c2){
  let code = board_state[r1][c1];
  if(!code) return false;
  let [col,type] = code.split("_");
  let target = board_state[r2][c2];
  if(target && target.startsWith(col)) return false;
  let dr = r2-r1, dc = c2-c1;
  if(type==='pawn'){
    let dir = col==='nim'?-1:1;
    if(dr===dir && dc===0 && !target) return true;
    if(dr===2*dir && dc===0 && !target && ((col==='nim'&&r1===6)||(col==='mor'&&r1===1)) && !board_state[r1+dir][c1]) return true;
    if(dr===dir && Math.abs(dc)===1 && target && !target.startsWith(col)) return true;
    return false;
  }
  return true; // semplificato per ora
}

// Esegui mossa
function makeMove(r1,c1,r2,c2){
  if(!isMoveLegal(r1,c1,r2,c2)) return;
  let piece = board_state[r1][c1];
  if(piece.endsWith("pawn") && (r2===0 || r2===7)) piece = color+"_queen";
  board_state[r2][c2]=piece;
  board_state[r1][c1]='';
  turn = turn==='nim'?'mor':'nim';
  renderBoard();
  if(conn) conn.send({board:board_state,turn:turn});
}

// PeerJS
peer.on('open', id => {
  color = 'nim';
  info.textContent="Sei "+color.toUpperCase()+". ID tuo: "+id;
});

connectBtn.addEventListener('click', ()=>{
  const remoteId = peerInput.value.trim();
  if(remoteId){
    conn = peer.connect(remoteId);
    conn.on('open', ()=>{ 
      color='mor'; 
      setupDiv.style.display='none'; 
      renderBoard();
    });
    conn.on('data', data=>{
      board_state = data.board;
      turn = data.turn;
      renderBoard();
    });
  }
});

peer.on('connection', connection => {
  conn = connection;
  color='mor';
  setupDiv.style.display='none';
  renderBoard();
  conn.on('data', data=>{
    board_state = data.board;
    turn = data.turn;
    renderBoard();
  });
});

renderBoard();
