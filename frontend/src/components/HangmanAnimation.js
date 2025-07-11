import React from 'react';
import './HangmanAnimation.css';

const HangmanAnimation = ({ hangmanState = 0 }) => {
  const parts = [
    'head',
    'body',
    'left-arm',
    'right-arm',
    'left-leg',
    'right-leg'
  ];

  return (
    <div className="hangman-container">
      <svg viewBox="0 0 200 250" className="hangman-svg">
        {/* Gallows */}
        <line x1="10" y1="230" x2="150" y2="230" stroke="#8B4513" strokeWidth="4" />
        <line x1="30" y1="230" x2="30" y2="20" stroke="#8B4513" strokeWidth="4" />
        <line x1="30" y1="20" x2="100" y2="20" stroke="#8B4513" strokeWidth="4" />
        <line x1="100" y1="20" x2="100" y2="50" stroke="#8B4513" strokeWidth="4" />
        
        {/* Body parts appear based on hangmanState */}
        {hangmanState >= 1 && (
          <circle cx="100" cy="60" r="10" stroke="#000" strokeWidth="2" fill="none" className="hangman-part head" />
        )}
        {hangmanState >= 2 && (
          <line x1="100" y1="70" x2="100" y2="130" stroke="#000" strokeWidth="2" className="hangman-part body" />
        )}
        {hangmanState >= 3 && (
          <line x1="100" y1="90" x2="80" y2="110" stroke="#000" strokeWidth="2" className="hangman-part left-arm" />
        )}
        {hangmanState >= 4 && (
          <line x1="100" y1="90" x2="120" y2="110" stroke="#000" strokeWidth="2" className="hangman-part right-arm" />
        )}
        {hangmanState >= 5 && (
          <line x1="100" y1="130" x2="80" y2="160" stroke="#000" strokeWidth="2" className="hangman-part left-leg" />
        )}
        {hangmanState >= 6 && (
          <line x1="100" y1="130" x2="120" y2="160" stroke="#000" strokeWidth="2" className="hangman-part right-leg" />
        )}
      </svg>
    </div>
  );
};

export default HangmanAnimation;