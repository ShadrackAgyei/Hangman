# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Node.js/Express/Socket.io)
```bash
cd backend && npm install    # Install backend dependencies
cd backend && npm run dev    # Start development server with nodemon
cd backend && npm start      # Start production server
```

### Frontend (React)
```bash
cd frontend && npm install   # Install frontend dependencies
cd frontend && npm start     # Start development server (port 3000)
cd frontend && npm run build # Build for production
cd frontend && npm test      # Run tests
```

### Monorepo Commands
```bash
npm run start:backend        # Start backend dev server
npm run start:frontend       # Start frontend dev server
npm run install:all         # Install all dependencies
```

## Architecture Overview

This is a real-time multiplayer Hangman game with a monorepo structure:

### Backend (`/backend`)
- **Stack**: Node.js, Express, Socket.io
- **Port**: 3001
- **Core file**: `server.js` - Contains all Socket.io event handlers and game logic
- **Architecture**: Single-file server with in-memory storage
- **Key features**:
  - Room management with 6-character codes
  - Moderator/player roles
  - Real-time game state synchronization
  - Turn-based gameplay with 30-second timers
  - Scoring system (start with 10 points)
  - Disconnect/reconnect handling

### Frontend (`/frontend`)
- **Stack**: React, React Router, Socket.io-client
- **Port**: 3000
- **Architecture**: Context-based state management
- **Key components**:
  - `GameContext.js` - Central state management for socket, user, room, game data
  - `LobbyPage.js` - Room creation/joining interface
  - `GamePage.js` - Main game interface
  - `GameOverPage.js` - Final scores and restart
  - `ModeratorPanel.js` - Word list management for moderators

### Game Flow
1. Moderator creates room with room size/word count settings
2. Players join using 6-character room codes
3. Moderator submits word list with categories
4. Game starts with turn-based letter guessing
5. Players score +1 for correct letters, -1 for wrong, +1 bonus for solving
6. Game cycles through all words, then shows final scoreboard

### Socket Events
- `createRoom`, `joinRoom`, `submitWords`, `startGame`
- `guessLetter`, `solveWord`, `restartGame`, `reconnectPlayer`
- `roomUpdate`, `gameUpdate`, `scoreUpdate`, `timerUpdate`, `gameOver`

## Development Notes

- Backend uses in-memory storage - no database required
- Frontend connects to `http://localhost:3001` hardcoded in GameContext
- All game state is managed server-side and broadcast to clients
- Room codes are 6 characters from set `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Turn timer is 30 seconds, implemented with setTimeout
- Moderator disconnection closes the entire room