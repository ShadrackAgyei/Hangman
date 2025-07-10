import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import GameOverPage from './pages/GameOverPage';
import { GameProvider } from './context/GameContext';

function App() {
  return (
    <GameProvider>
      <Router>
        <div style={{
          fontFamily: 'Arial, sans-serif',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/gameover" element={<GameOverPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App; 