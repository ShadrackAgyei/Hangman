const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Load word list from JSON file
let wordDatabase = {};
try {
  const wordListPath = path.join(__dirname, 'wordlist.json');
  const wordListData = fs.readFileSync(wordListPath, 'utf8');
  wordDatabase = JSON.parse(wordListData);
} catch (error) {
  console.error('Error loading word database:', error);
  wordDatabase = {}; // Fallback to empty database
}

// Utility to generate a unique 6-letter room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Function to randomly select words from chosen categories
function selectRandomWords(categories, wordCount) {
  const selectedWords = [];
  const availableWords = [];
  
  // Collect all words from selected categories
  categories.forEach(category => {
    if (wordDatabase[category]) {
      wordDatabase[category].forEach(wordObj => {
        availableWords.push({
          word: wordObj.word,
          category: category,
          hint: wordObj.hint
        });
      });
    }
  });
  
  // Shuffle and select requested number of words
  for (let i = 0; i < wordCount && availableWords.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    selectedWords.push(availableWords.splice(randomIndex, 1)[0]);
  }
  
  return selectedWords;
}

// Helper: Get next active player index
function getNextPlayerIndex(room, currentIndex) {
  const n = room.players.length;
  if (n === 0) return null; // No players left
  return (currentIndex + 1) % n;
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
  room.game.hint = wordObj.hint || '';
  room.game.revealed = Array(word.length).fill('_');
  room.game.incorrectGuesses = [];
  room.game.hangmanState = 0;
  room.game.guessedLetters = [];
  room.game.solved = false;
  // Note: turnIndex is NOT reset here - it continues from the current player
}

io.on('connection', (socket) => {

  // Moderator creates a room
  socket.on('createRoom', ({ username, roomSize, wordCount }, callback) => {
    try {
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
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ error: 'Failed to create room' });
    }
  });

  // Player joins a room
  socket.on('joinRoom', ({ roomCode, username }, callback) => {
    try {
      const room = rooms[roomCode];
      if (!room) return callback({ error: 'Room not found' });
      if (room.players.length >= room.settings.roomSize) return callback({ error: 'Room is full' });
      room.players.push({ id: socket.id, username, score: 10 });
      socket.join(roomCode);
      callback({ success: true });
      io.to(roomCode).emit('roomUpdate', room);
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ error: 'Failed to join room' });
    }
  });

  // Moderator submits categories for random word selection
  socket.on('submitCategories', ({ roomCode, categories, wordCount }, callback) => {
    const room = rooms[roomCode];
    if (!room || room.moderator.id !== socket.id) return callback({ error: 'Not authorized' });
    
    // Generate random word list from selected categories
    const selectedWords = selectRandomWords(categories, wordCount);
    
    if (selectedWords.length < wordCount) {
      return callback({ error: `Not enough words available. Found ${selectedWords.length} words, need ${wordCount}` });
    }
    
    room.wordList = selectedWords;
    room.selectedCategories = categories;
    io.to(roomCode).emit('roomUpdate', room);
    callback({ success: true });
  });

  // Get available categories (for frontend)
  socket.on('getCategories', (callback) => {
    const categories = Object.keys(wordDatabase);
    callback({ categories });
  });

  // Moderator starts the game
  socket.on('startGame', ({ roomCode }, callback) => {
    try {
      const room = rooms[roomCode];
      if (!room || room.moderator.id !== socket.id) {
        return callback({ error: 'Not authorized' });
      }
      if (!room.wordList || room.wordList.length === 0) {
        return callback({ error: 'No categories selected or words generated' });
      }
      if (!room.players || room.players.length === 0) {
        return callback({ error: 'No players in room' });
      }
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
      io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
      startTurnTimer(roomCode);
      callback({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      callback({ error: 'Failed to start game' });
    }
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
    room.players.forEach(p => { p.score = 10; });
    room.state = 'lobby';
    room.wordList = [];
    room.game = null;
    io.to(roomCode).emit('roomUpdate', room);
    callback({ success: true });
  });

  // Player reconnects (now just joins as a new player since disconnected players are removed)
  socket.on('reconnectPlayer', ({ roomCode, username }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: 'Room not found' });
    
    // Since disconnected players are removed, treat this as a new join
    if (room.players.length >= room.settings.roomSize) {
      return callback({ error: 'Room is full' });
    }
    
    // Add as new player
    room.players.push({ id: socket.id, username, score: 10 });
    socket.join(roomCode);
    io.to(roomCode).emit('roomUpdate', room);
    callback({ success: true });
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    try {
      for (const [roomCode, room] of Object.entries(rooms)) {
        if (!room) continue;
        
        if (room.moderator && room.moderator.id === socket.id) {
          // If moderator disconnects, close the room
          io.to(roomCode).emit('roomClosed');
          delete rooms[roomCode];
        } else if (room.players && Array.isArray(room.players)) {
          const playerIndex = room.players.findIndex(p => p && p.id === socket.id);
          if (playerIndex !== -1) {
            const wasCurrentPlayer = room.state === 'playing' && room.game && room.game.turnIndex === playerIndex;
            
            // Remove player completely from the room
            room.players.splice(playerIndex, 1);
            
            // Update turn index if necessary
            if (room.state === 'playing' && room.game && room.game.turnIndex !== undefined) {
              if (playerIndex < room.game.turnIndex) {
                // Removed player was before current turn, adjust turn index
                room.game.turnIndex--;
              } else if (wasCurrentPlayer) {
                // Removed player was current turn, keep same index (will be next player)
                // But adjust if we're now beyond the array bounds
                if (room.game.turnIndex >= room.players.length) {
                  room.game.turnIndex = 0;
                }
                if (room.game.timer) {
                  clearTimeout(room.game.timer);
                }
              }
              
              // Check if any players are left
              if (room.players.length === 0) {
                endGame(roomCode);
                continue;
              }
              
              // If it was the current player's turn, immediately start next turn
              if (wasCurrentPlayer) {
                setTimeout(() => {
                  startTurnTimer(roomCode);
                }, 1000);
              }
            }
            
            io.to(roomCode).emit('roomUpdate', room);
            if (room.state === 'playing' && room.game) {
              io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
              io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// --- Game Logic Helpers ---

function getGamePublicState(room) {
  const g = room.game;
  return {
    currentWordIndex: g.currentWordIndex,
    totalWords: room.wordList.length,
    category: g.category,
    hint: g.hint,
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
  return room.players.map(p => ({ username: p.username, score: p.score, connected: true }));
}

function startTurnTimer(roomCode) {
  try {
    const room = rooms[roomCode];
    if (!room || !room.game) {
      return;
    }
    const game = room.game;
    
    // Check if there are any players left
    if (!room.players || room.players.length === 0) {
      endGame(roomCode);
      return;
    }
    
    // Ensure turn index is valid
    if (game.turnIndex >= room.players.length) {
      game.turnIndex = 0;
    }
    
    // Clear any existing timer
    if (game.timer) {
      clearTimeout(game.timer);
    }
    
    game.timerEnd = Date.now() + 10000;
    io.to(roomCode).emit('timerUpdate', { timerEnd: game.timerEnd });
    io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
    game.timer = setTimeout(() => {
      nextTurn(roomCode, true);
    }, 10000);
  } catch (error) {
    console.error('Error in startTurnTimer:', error);
    // Try to recover by ending the game
    try {
      endGame(roomCode);
    } catch (endError) {
      console.error('Error ending game after timer error:', endError);
    }
  }
}

function nextTurn(roomCode, skip = false) {
  try {
    const room = rooms[roomCode];
    if (!room || !room.game) return;
    const game = room.game;
    
    // Check if there are any players left
    if (!room.players || room.players.length === 0) {
      endGame(roomCode);
      return;
    }
    
    if (skip) {
      // Apply penalty for timeout
      const currentPlayer = room.players[game.turnIndex];
      if (currentPlayer) {
        currentPlayer.score -= 1;
        io.to(roomCode).emit('scoreUpdate', getScoreboard(room));
      }
    }
    
    // Move to next player
    const nextIdx = getNextPlayerIndex(room, game.turnIndex);
    if (nextIdx === null) {
      // No players left, end game
      endGame(roomCode);
      return;
    }
    game.turnIndex = nextIdx;
    game.timerEnd = null;
    io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
    startTurnTimer(roomCode);
  } catch (error) {
    console.error('Error in nextTurn:', error);
    try {
      endGame(roomCode);
    } catch (endError) {
      console.error('Error ending game after nextTurn error:', endError);
    }
  }
}

function nextWordOrEnd(roomCode) {
  try {
    const room = rooms[roomCode];
    if (!room || !room.game) return;
    
    room.game.currentWordIndex++;
    if (room.game.currentWordIndex >= room.wordList.length) {
      endGame(roomCode);
    } else {
      // Advance to next player for the new word
      const nextIdx = getNextPlayerIndex(room, room.game.turnIndex);
      if (nextIdx !== null) {
        room.game.turnIndex = nextIdx;
      }
      setupNextWord(room);
      io.to(roomCode).emit('gameUpdate', getGamePublicState(room));
      startTurnTimer(roomCode);
    }
  } catch (error) {
    console.error('Error in nextWordOrEnd:', error);
    try {
      endGame(roomCode);
    } catch (endError) {
      console.error('Error ending game after nextWordOrEnd error:', endError);
    }
  }
}

function endGame(roomCode) {
  try {
    const room = rooms[roomCode];
    if (!room) return;
    room.state = 'finished';
    if (room.game && room.game.timer) {
      clearTimeout(room.game.timer);
      room.game.timer = null;
    }
    io.to(roomCode).emit('gameOver', getScoreboard(room));
  } catch (error) {
    console.error('Error in endGame:', error);
  }
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in production, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, just log the error
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
}); 