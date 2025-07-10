import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';

function GameOverPage() {
  const { socket, roomCode, scoreboard, setScoreboard } = useContext(GameContext);
  const navigate = useNavigate();

  const handleRestart = () => {
    socket.emit('restartGame', { roomCode: roomCode }, (res) => {
      if (res.success) {
        setScoreboard([]);
        navigate('/');
      }
    });
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Game Over</h2>
      <h3>Final Scores</h3>
      <ul>
        {scoreboard.map((p, i) => (
          <li key={i}>{p.username}: {p.score}</li>
        ))}
      </ul>
      <button onClick={handleRestart} style={{ marginTop: 16 }}>Restart Game</button>
    </div>
  );
}

export default GameOverPage; 