import React, { createContext, useState } from 'react';
import { io } from 'socket.io-client';

export const GameContext = createContext();

export function GameProvider({ children }) {
  const [socket] = useState(() => io('http://localhost:3001'));
  const [user, setUser] = useState(null); // { username, isModerator }
  const [room, setRoom] = useState(null); // room state from backend
  const [roomCode, setRoomCode] = useState(null); // room code
  const [game, setGame] = useState(null); // game state from backend
  const [scoreboard, setScoreboard] = useState([]);
  const [timerEnd, setTimerEnd] = useState(null);

  // Set up global socket listeners for debugging
  React.useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  // Clear game state when room code changes (new room created)
  React.useEffect(() => {
    if (roomCode) {
      setGame(null);
      setScoreboard([]);
      setTimerEnd(null);
    }
  }, [roomCode]);

  return (
    <GameContext.Provider value={{
      socket, user, setUser, room, setRoom, roomCode, setRoomCode, game, setGame, scoreboard, setScoreboard, timerEnd, setTimerEnd
    }}>
      {children}
    </GameContext.Provider>
  );
} 