from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ribillen123'
socketio = SocketIO(app)

# Stato iniziale
board_state = [
    ["mor_rook","mor_knight","mor_bishop","mor_queen","mor_king","mor_bishop","mor_knight","mor_rook"],
    ["mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn","mor_pawn"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn","nim_pawn"],
    ["nim_rook","nim_knight","nim_bishop","nim_queen","nim_king","nim_bishop","nim_knight","nim_rook"]
]

turn = 'nim'

# Mappa dei giocatori
players = {}

@app.route('/')
def index():
    return render_template('index.html')

# Connetti un giocatore e assegna colore
@socketio.on('join')
def on_join(data):
    sid = data['sid']
    if 'nim' not in players.values():
        players[sid] = 'nim'
        color = 'nim'
    else:
        players[sid] = 'mor'
        color = 'mor'
    emit('assign_color', color)

# Gestione mossa
@socketio.on('move')
def handle_move(data):
    global board_state, turn
    sid = data['sid']
    color = players.get(sid)
    if color != turn:
        emit('illegal_move')
        return

    r1,c1,r2,c2 = data['from'][0],data['from'][1],data['to'][0],data['to'][1]

    # Controllo legalità (puoi usare la funzione JS che abbiamo fatto e tradurla in Python)
    if not is_move_legal(r1,c1,r2,c2):
        emit('illegal_move')
        return

    # Promozione pedone
    piece = board_state[r1][c1]
    if piece.endswith('pawn') and (r2==0 or r2==7):
        piece = color+'_queen'

    board_state[r2][c2] = piece
    board_state[r1][c1] = ''
    turn = 'mor' if turn=='nim' else 'nim'

    socketio.emit('update_board', {'board': board_state, 'turn': turn})

# Funzioni logica di movimento
def path_clear(r1,c1,r2,c2):
    dr = (r2-r1)//max(abs(r2-r1),1) if r2!=r1 else 0
    dc = (c2-c1)//max(abs(c2-c1),1) if c2!=c1 else 0
    r,c = r1+dr,c1+dc
    while r!=r2 or c!=c2:
        if board_state[r][c]!='': return False
        r+=dr
        c+=dc
    return True

def is_move_legal(r1,c1,r2,c2):
    code = board_state[r1][c1]
    if not code: return False
    color,type = code.split('_')
    target = board_state[r2][c2]
    if target and target.startswith(color): return False
    dr,dc = r2-r1,c2-c1

    if type=='pawn':
        direction = -1 if color=='nim' else 1
        # avanzamento 1
        if dr==direction and dc==0 and not target: return True
        # avanzamento 2
        if dr==2*direction and dc==0 and not target:
            if (color=='nim' and r1==6) or (color=='mor' and r1==1):
                if board_state[r1+direction][c1]=='': return True
        # cattura diagonale
        if dr==direction and abs(dc)==1 and target and not target.startswith(color): return True
        return False
    if type=='rook': return (dr==0 or dc==0) and path_clear(r1,c1,r2,c2)
    if type=='bishop': return abs(dr)==abs(dc) and path_clear(r1,c1,r2,c2)
    if type=='queen': return (dr==0 or dc==0 or abs(dr)==abs(dc)) and path_clear(r1,c1,r2,c2)
    if type=='knight': return (abs(dr)==2 and abs(dc)==1) or (abs(dr)==1 and abs(dc)==2)
    if type=='king':
        if abs(dc)==2 and dr==0:
            rook_col = 7 if dc>0 else 0
            rook = board_state[r1][rook_col]
            if not rook or not rook.endswith('rook') or not rook.startswith(color): return False
            step = 1 if dc>0 else -1
            for i in range(1,abs(dc)+1):
                if board_state[r1][c1+i*step]!='': return False
            return True
        return abs(dr)<=1 and abs(dc)<=1
    return False

if __name__=='__main__':
    socketio.run(app, debug=True)
