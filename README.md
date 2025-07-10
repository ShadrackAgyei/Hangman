# Multiplayer Hangman Web Application

A real-time, multiplayer Hangman game with lobby rooms, moderator controls, categories, and a competitive scoring system.

## Features
- Real-time multiplayer (2-10 players per room)
- Lobby system with room codes
- Moderator controls (word lists, categories, game flow)
- Competitive scoring and persistent scoreboard
- Responsive, minimal UI
- Graceful handling of disconnects

## Tech Stack
- **Frontend:** React, Socket.io-client, CSS3
- **Backend:** Node.js, Express, Socket.io

## Getting Started

### 1. Install dependencies
```
cd backend && npm install
cd ../frontend && npm install
```

### 2. Run locally (in two terminals)
```
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:3000`

### 3. Build for Deployment
- Frontend: `npm run build` (output in `frontend/build`)
- Backend: Can be configured to serve static frontend files for production

## Deployment
- Deploy backend (Node.js) to Heroku, Render, or similar
- Deploy frontend (React) to Netlify, Vercel, or serve via backend

---

## Project Structure
```
/backend   # Express + Socket.io server
/frontend  # React app
```

---

## License
MIT 