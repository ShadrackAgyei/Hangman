const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure CORS for production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://your-app-name.onrender.com']
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.get('/health', (req, res) => res.send('OK'));

// In-memory store for rooms and users
const rooms = {}; // { roomCode: { moderator, players: [], settings, state } }

// Utility to generate a unique 6-letter room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Helper: Get next active player index
function getNextPlayerIndex(room, currentIndex) {
  const n = room.players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (currentIndex + i) % n;
    if (room.players[idx].connected) return idx;
  }
  return null; // All disconnected
}

// Helper: Reveal letter in word
function revealLetters(word, revealed, letter) {
  let found = false;
  for (let i = 0; i < word.length; i++) {
    if (word[i].toLowerCase() === letter.toLowerCase()) {
      revealed[i] = word[i];
      found = true;
    }
  }
  return found;
}

// Helper: Check if word is fully revealed
function isWordSolved(revealed) {
  return revealed.every(l => l !== '_');
}

// Helper: Prepare next word/game state
function setupNextWord(room) {
  const wordObj = room.wordList[room.game.currentWordIndex];
  const word = wordObj.word;
  room.game.currentWord = word;
  room.game.category = wordObj.category;
  room.game.revealed = Array(word.length).fill('_');
  room.game.incorrectGuesses = [];
  room.game.hangmanState = 0;
  room.game.turnIndex = 0;
  room.game.guessedLetters = [];
  room.game.solved = false;
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Moderator creates a room
  socket.on('createRoom', ({ username, roomSize, wordCount }, callback) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      moderator: { id: socket.id, username },
      players: [],
      settings: { roomSize, wordCount },
      state: 'lobby',
      wordList: [],
      category: null,
      game: null
    };
    socket.join(roomCode);
    callback({ roomCode });
    io.to(roomCode).emit('roomUpdate', rooms[roomCode]);
  });

  // Player joins a room
  socket.on('joinRoom', ({ roomCode, username }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: 'Room not found' });
    if (room.players.length >= room.settings.roomSize) return callback({ error: 'Room is full' });
    room.players.push({ id: socket.id, username, score: 10, connected: true });
    socket.join(roomCode);
    callback({ success: true });
    io.to(roomCode).emit('roomUpdate', room);
  });

  // Moderator submits word list and categories
  socket.on('submitWords', ({ roomCode, wordList }, callback) => {
    const room = rooms[roomCode];
    if (!room || room.moderator.id !== socket.id) return callback({ error: 'Not authorized' });
    // wordList: [{ word: 'tiger', category: 'Animals' }, ...]
    room.wordList = wordList;
    io.to(roomCode).emit('roomUpdate', room);
    callback({ success: true });
  });

  // Moderator starts the game
  socket.on('startGame', ({ roomCode }, callback) => {
    console.log('startGame received:', { roomCode, socketId: socket.id });
    const room = rooms[roomCode];
    if (!room || room.moderator.id !== socket.id) {
      console.log('Authorization failed:', { roomExists: !!room, moderatorId: room?.moderator?.id, socketId: socket.id });
      return callback({ error: 'Not authorized' });
    }
    if (!room.wordList || room.wordList.length === 0) {
      console.log('No words submitted');
      return callback({ error: 'No words submitted' });
    }
    console.log('Starting game for room:', roomCode);
    // Initialize game state
    room.state = 'playing';
    room.game = {
      currentWordIndex: 0,
      currentWord: '',
      category: '',
      revealed: [],
      incorrectGuesses: [],
      hangmanState: 0,
      turnIndex: 0, // index in players array
      guessedLetters: [],
      solved: false,
      timer: null,
      timerEnd: null
    };
    setupNextWord(room);
    console.log('Emitting gameUpdate to room:', roomCode);
    io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
    console.log('Starting turn timer');
    startTurnTimer(roomCode);
    callback({ success: true });
  });

  // Player guesses a letter
  socket.on('guessLetter', ({ roomCode, letter }, callback) => {
    const room = rooms[roomCode];
    if (!room || room.state !== 'playing') return callback({ error: 'Game not in progress' });
    const game = room.game;
    const playerIdx = game.turnIndex;
    const player = room.players[playerIdx];
    if (player.id !== socket.id) return callback({ error: 'Not your turn' });
    if (game.guessedLetters.includes(letter.toLowerCase())) return callback({ error: 'Letter already guessed' });
    game.guessedLetters.push(letter.toLowerCase());
    let correct = revealLetters(game.currentWord, game.revealed, letter);
    if (correct) {
      player.score += 1;
      io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
      if (isWordSolved(game.revealed)) {
        player.score += 1; // Bonus for solving
        game.solved = true;
        clearTimeout(game.timer);
        io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
        io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
        setTimeout(() => {
          nextWordOrEnd(roomCode);
        }, 2000);
        return callback({ correct: true, solved: true });
      }
    } else {
      player.score -= 1;
      game.incorrectGuesses.push(letter.toLowerCase());
      game.hangmanState += 1;
      io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
    }
    io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
    clearTimeout(game.timer);
    setTimeout(() => {
      nextTurn(roomCode);
    }, 1000);
    callback({ correct, solved: false });
  });

  // Player solves the word (guesses the whole word)
  socket.on('solveWord', ({ roomCode, guess }, callback) => {
    const room = rooms[roomCode];
    if (!room || room.state !== 'playing') return callback({ error: 'Game not in progress' });
    const game = room.game;
    const playerIdx = game.turnIndex;
    const player = room.players[playerIdx];
    if (player.id !== socket.id) return callback({ error: 'Not your turn' });
    if (guess.toLowerCase() === game.currentWord.toLowerCase()) {
      for (let i = 0; i < game.currentWord.length; i++) game.revealed[i] = game.currentWord[i];
      player.score += 2; // 1 for correct, 1 bonus
      game.solved = true;
      clearTimeout(game.timer);
      io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
      io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
      setTimeout(() => {
        nextWordOrEnd(roomCode);
      }, 2000);
      return callback({ correct: true, solved: true });
    } else {
      player.score -= 1;
      io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
      clearTimeout(game.timer);
      setTimeout(() => {
        nextTurn(roomCode);
      }, 1000);
      return callback({ correct: false, solved: false });
    }
  });

  // Player requests to restart game
  socket.on('restartGame', ({ roomCode }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: 'Room not found' });
    // Reset scores and state
    room.players.forEach(p => { p.score = 10; p.connected = true; });
    room.state = 'lobby';
    room.wordList = [];
    room.game = null;
    io.to(roomCode).emit('roomUpdate', room);
    callback({ success: true });
  });

  // Player reconnects
  socket.on('reconnectPlayer', ({ roomCode, username }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: 'Room not found' });
    const player = room.players.find(p => p.username === username);
    if (player) {
      player.id = socket.id;
      player.connected = true;
      socket.join(roomCode);
      io.to(roomCode).emit('roomUpdate', room);
      callback({ success: true });
    } else {
      callback({ error: 'Player not found' });
    }
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    for (const [roomCode, room] of Object.entries(rooms)) {
      if (room.moderator.id === socket.id) {
        // If moderator disconnects, close the room
        io.to(roomCode).emit('roomClosed');
        delete rooms[roomCode];
      } else {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.connected = false;
          io.to(roomCode).emit('roomUpdate', room);
        }
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// --- Game Logic Helpers ---

function getGamePublicState(room) {
  const g = room.game;
  return {
    currentWordIndex: g.currentWordIndex,
    totalWords: room.wordList.length,
    category: g.category,
    revealed: g.revealed,
    incorrectGuesses: g.incorrectGuesses,
    hangmanState: g.hangmanState,
    turnIndex: g.turnIndex,
    guessedLetters: g.guessedLetters,
    solved: g.solved,
    state: room.state,
    timerEnd: g.timerEnd
  };
}

function getScoreboard(room) {
  return room.players.map(p => ({ username: p.username, score: p.score, connected: p.connected }));
}

function startTurnTimer(roomCode) {
  console.log('startTurnTimer called for room:', roomCode);
  const room = rooms[roomCode];
  if (!room || !room.game) {
    console.log('startTurnTimer: room or game not found');
    return;
  }
  const game = room.game;
  game.timerEnd = Date.now() + 5000;
  console.log('Emitting timerUpdate to room:', roomCode, 'timerEnd:', game.timerEnd);
  io.to(roomCode).emit('timerUpdate', { timerEnd: game.timerEnd });
  game.timer = setTimeout(() => {
    console.log('Timer expired for room:', roomCode);
    nextTurn(roomCode, true);
  }, 5000);
}

function nextTurn(roomCode, skip = false) {
  const room = rooms[roomCode];
  if (!room || !room.game) return;
  const game = room.game;
  if (skip) {
    // Apply penalty for timeout
    const currentPlayer = room.players[game.turnIndex];
    if (currentPlayer && currentPlayer.connected) {
      currentPlayer.score -= 1;
      io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
    }
  }
  // Move to next connected player
  const nextIdx = getNextPlayerIndex(room, game.turnIndex);
  if (nextIdx === null) {
    // All players disconnected, end game
    endGame(roomCode);
    return;
  }
  game.turnIndex = nextIdx;
  game.timerEnd = null;
  io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
  startTurnTimer(roomCode);
}

function nextWordOrEnd(roomCode) {
  const room = rooms[roomCode];
  if (!room || !room.game) return;
  room.game.currentWordIndex++;
  if (room.game.currentWordIndex >= room.wordList.length) {
    endGame(roomCode);
  } else {
    setupNextWord(room);
    io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
    startTurnTimer(roomCode);
  }
}

function endGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.state = 'finished';
  if (room.game && room.game.timer) clearTimeout(room.game.timer);
  io.to(roomCode).emit('gameOver', getScoreboard(room));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 