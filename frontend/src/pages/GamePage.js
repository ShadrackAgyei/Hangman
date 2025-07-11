import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import ModeratorPanel from '../components/ModeratorPanel';
import HangmanAnimation from '../components/HangmanAnimation';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function GamePage() {
  const { socket, user, room, roomCode, game, setGame, scoreboard, setScoreboard, timerEnd, setTimerEnd } = useContext(GameContext);
  const [message, setMessage] = useState('');
  const [currentTimeLeft, setCurrentTimeLeft] = useState(0);
  const navigate = useNavigate();

  // Listen for game/score/timer updates
  useEffect(() => {
    const handleGameUpdate = (gameData) => {
      console.log('GamePage received gameUpdate:', gameData);
      setGame(gameData);
      // Update timer if included in game data
      if (gameData && gameData.timerEnd) {
        console.log('Setting timer from gameUpdate:', gameData.timerEnd);
        setTimerEnd(gameData.timerEnd);
      }
    };
    
    const handleTimerUpdate = ({ timerEnd }) => {
      console.log('GamePage received timerUpdate:', { timerEnd });
      setTimerEnd(timerEnd);
    };
    
    const handleScoreUpdate = (scores) => {
      console.log('GamePage received scoreUpdate:', scores);
      setScoreboard(scores);
    };
    
    socket.on('gameUpdate', handleGameUpdate);
    socket.on('scoreUpdate', handleScoreUpdate);
    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('gameOver', (finalScores) => {
      console.log('GamePage received gameOver:', finalScores);
      setScoreboard(finalScores);
      navigate('/gameover');
    });
    return () => {
      socket.off('gameUpdate', handleGameUpdate);
      socket.off('scoreUpdate', handleScoreUpdate);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('gameOver');
    };
  }, [socket, setGame, setScoreboard, setTimerEnd, navigate]);

  // Initialize timer if game already has timerEnd when component loads
  useEffect(() => {
    if (game && game.timerEnd && !timerEnd) {
      console.log('Initializing timer from existing game data:', game.timerEnd);
      setTimerEnd(game.timerEnd);
    }
  }, [game, timerEnd, setTimerEnd]);

  // Smooth timer countdown effect
  useEffect(() => {
    if (!timerEnd) {
      setCurrentTimeLeft(0);
      return;
    }
    
    const updateTimer = () => {
      const timeLeft = Math.max(0, Math.floor((timerEnd - Date.now()) / 1000));
      setCurrentTimeLeft(timeLeft);
    };
    
    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 100); // Update every 100ms for smoother animation
    
    return () => clearInterval(interval);
  }, [timerEnd]);

  // Show moderator panel if moderator and game not started
  if (user?.isModerator && (!game || game.currentWordIndex === undefined)) {
    return <ModeratorPanel wordCount={room?.settings?.wordCount || 5} roomCode={roomCode} />;
  }

  if (!game || !room) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading game...
      </div>
    );
  }

  const isMyTurn = room.players[game.turnIndex]?.username === user.username;
  const guessedLetters = game.guessedLetters || [];

  const handleLetterClick = (letter) => {
    if (!isMyTurn || guessedLetters.includes(letter.toLowerCase())) return;
    
    socket.emit('guessLetter', { roomCode: roomCode, letter }, (res) => {
      if (res.error) setMessage(res.error);
      else setMessage(res.correct ? 'Correct!' : 'Incorrect!');
      setTimeout(() => setMessage(''), 2000);
    });
  };


  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    },
    gameCard: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px'
    },
    category: {
      fontSize: '24px',
      color: '#666',
      marginBottom: '10px'
    },
    hint: {
      fontSize: '18px',
      color: '#2196F3',
      marginBottom: '10px',
      fontStyle: 'italic',
      backgroundColor: '#f0f8ff',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #e3f2fd'
    },
    progress: {
      fontSize: '14px',
      color: '#888'
    },
    wordDisplay: {
      fontSize: '48px',
      fontWeight: 'bold',
      textAlign: 'center',
      letterSpacing: '8px',
      margin: '30px 0',
      fontFamily: 'monospace',
      color: '#333'
    },
    turnInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px'
    },
    currentPlayer: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: isMyTurn ? '#4CAF50' : '#666'
    },
    timer: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: currentTimeLeft <= 5 ? '#f44336' : '#333'
    },
    alphabetContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(13, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: '8px',
      marginBottom: '20px',
      maxWidth: '650px',
      margin: '0 auto 20px auto'
    },
    letterButton: {
      padding: '12px 8px',
      fontSize: '18px',
      fontWeight: 'bold',
      border: '2px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'white'
    },
    letterButtonActive: {
      backgroundColor: '#2196F3',
      borderColor: '#2196F3',
      color: 'white'
    },
    letterButtonDisabled: {
      backgroundColor: '#f5f5f5',
      borderColor: '#ccc',
      color: '#999',
      cursor: 'not-allowed'
    },
    message: {
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '10px 0',
      color: '#333'
    },
    incorrectGuesses: {
      textAlign: 'center',
      margin: '15px 0',
      fontSize: '16px',
      color: '#666'
    },
    scoreboardCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    },
    scoreboardTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center'
    },
    scoreItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #eee'
    },
    playerName: {
      fontSize: '16px',
      fontWeight: user.username === scoreboard.find(p => p.username)?.username ? 'bold' : 'normal'
    },
    playerScore: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#4CAF50'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.gameCard}>
        <div style={styles.header}>
          <div style={styles.category}>Category: {game.category}</div>
          {game.hint && (
            <div style={styles.hint}>Hint: {game.hint}</div>
          )}
          <div style={styles.progress}>
            Word {game.currentWordIndex + 1} of {game.totalWords}
          </div>
        </div>

        <HangmanAnimation hangmanState={game.hangmanState || 0} />

        <div style={styles.wordDisplay}>
          {game.revealed?.map((letter, i) => (
            <span key={i}>{letter === '_' ? '_' : letter}</span>
          ))}
        </div>

        <div style={styles.turnInfo}>
          <div style={styles.currentPlayer}>
            {isMyTurn ? "Your turn!" : `${room.players[game.turnIndex]?.username}'s turn`}
          </div>
          <div style={styles.timer}>
            {currentTimeLeft}s
          </div>
        </div>

        <div style={styles.alphabetContainer}>
          {ALPHABET.map(letter => {
            const isUsed = guessedLetters.includes(letter.toLowerCase());
            const isDisabled = !isMyTurn || isUsed;
            
            return (
              <button
                key={letter}
                style={{
                  ...styles.letterButton,
                  ...(isUsed ? styles.letterButtonDisabled : {}),
                  ...(!isDisabled && isMyTurn ? styles.letterButtonActive : {})
                }}
                onClick={() => handleLetterClick(letter)}
                disabled={isDisabled}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {game.incorrectGuesses && game.incorrectGuesses.length > 0 && (
          <div style={styles.incorrectGuesses}>
            Incorrect guesses: {game.incorrectGuesses.join(', ').toUpperCase()}
          </div>
        )}

        {message && <div style={styles.message}>{message}</div>}
      </div>

      <div style={styles.scoreboardCard}>
        <div style={styles.scoreboardTitle}>Scoreboard</div>
        {scoreboard.map((player, i) => (
          <div key={i} style={styles.scoreItem}>
            <div style={{
              ...styles.playerName,
              color: player.username === user.username ? '#4CAF50' : '#333'
            }}>
              {player.username === user.username ? `${player.username} (You)` : player.username}
            </div>
            <div style={styles.playerScore}>{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GamePage; 