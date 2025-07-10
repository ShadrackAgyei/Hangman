import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';

function GameOverPage() {
  const { socket, roomCode, scoreboard, setScoreboard } = useContext(GameContext);
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti effect when component mounts
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const handleRestart = () => {
    socket.emit('restartGame', { roomCode: roomCode }, (res) => {
      if (res.success) {
        setScoreboard([]);
        navigate('/');
      }
    });
  };

  const handleNewGame = () => {
    navigate('/');
  };

  // Sort players by score (highest first)
  const sortedPlayers = [...scoreboard].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);
  const remainingPlayers = sortedPlayers.slice(3);

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    confetti: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      marginBottom: '10px',
      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      animation: 'bounceIn 1s ease-out'
    },
    subtitle: {
      fontSize: '20px',
      color: '#666',
      marginBottom: '40px',
      animation: 'fadeIn 1s ease-out 0.5s both'
    },
    podiumContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'end',
      gap: '30px',
      marginBottom: '50px',
      flexWrap: 'wrap',
      animation: 'slideUp 1s ease-out 0.8s both'
    },
    podiumPosition: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    },
    podiumPlayer: {
      backgroundColor: 'white',
      padding: '25px 20px',
      borderRadius: '15px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      marginBottom: '15px',
      minWidth: '180px',
      position: 'relative',
      transition: 'all 0.3s ease'
    },
    firstPlace: {
      order: 2,
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: 'white',
      transform: 'scale(1.15)',
      boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4)'
    },
    secondPlace: {
      order: 1,
      background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
      color: 'white',
      transform: 'scale(1.05)',
      boxShadow: '0 8px 32px rgba(192, 192, 192, 0.3)'
    },
    thirdPlace: {
      order: 3,
      background: 'linear-gradient(135deg, #CD7F32, #B8860B)',
      color: 'white',
      transform: 'scale(1)',
      boxShadow: '0 6px 24px rgba(205, 127, 50, 0.3)'
    },
    podiumBase: {
      width: '140px',
      borderRadius: '12px 12px 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      fontWeight: 'bold',
      color: 'white',
      transition: 'all 0.3s ease'
    },
    firstBase: {
      height: '100px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      order: 2,
      boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)'
    },
    secondBase: {
      height: '70px',
      background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
      order: 1,
      boxShadow: '0 3px 15px rgba(192, 192, 192, 0.3)'
    },
    thirdBase: {
      height: '50px',
      background: 'linear-gradient(135deg, #CD7F32, #B8860B)',
      order: 3,
      boxShadow: '0 2px 10px rgba(205, 127, 50, 0.3)'
    },
    crown: {
      position: 'absolute',
      top: '-20px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '40px',
      animation: 'crownGlow 2s ease-in-out infinite'
    },
    playerName: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    playerScore: {
      fontSize: '28px',
      fontWeight: 'bold'
    },
    remainingPlayersCard: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      maxWidth: '600px',
      margin: '0 auto 30px auto',
      animation: 'fadeIn 1s ease-out 1.2s both'
    },
    remainingTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#333'
    },
    remainingPlayer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 0',
      borderBottom: '1px solid #eee',
      transition: 'all 0.2s ease'
    },
    remainingPosition: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#666',
      minWidth: '50px'
    },
    remainingName: {
      fontSize: '18px',
      flex: 1,
      textAlign: 'left',
      marginLeft: '20px'
    },
    remainingScore: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333'
    },
    buttonContainer: {
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      flexWrap: 'wrap',
      animation: 'fadeIn 1s ease-out 1.5s both'
    },
    button: {
      padding: '18px 35px',
      fontSize: '18px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '160px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },
    restartButton: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    newGameButton: {
      backgroundColor: '#2196F3',
      color: 'white'
    }
  };

  const getPodiumStyles = (position) => {
    switch (position) {
      case 0: return { ...styles.podiumPlayer, ...styles.firstPlace };
      case 1: return { ...styles.podiumPlayer, ...styles.secondPlace };
      case 2: return { ...styles.podiumPlayer, ...styles.thirdPlace };
      default: return styles.podiumPlayer;
    }
  };

  const getBaseStyles = (position) => {
    switch (position) {
      case 0: return { ...styles.podiumBase, ...styles.firstBase };
      case 1: return { ...styles.podiumBase, ...styles.secondBase };
      case 2: return { ...styles.podiumBase, ...styles.thirdBase };
      default: return styles.podiumBase;
    }
  };

  const getPositionText = (position) => {
    switch (position) {
      case 0: return '1st';
      case 1: return '2nd';
      case 2: return '3rd';
      default: return `${position + 1}th`;
    }
  };

  const Confetti = () => {
    if (!showConfetti) return null;
    
    const confetti = [];
    for (let i = 0; i < 100; i++) {
      confetti.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-10px',
            width: '10px',
            height: '10px',
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
            animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      );
    }
    
    return <div style={styles.confetti}>{confetti}</div>;
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes crownGlow {
            0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5)); }
            50% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)); }
          }
          
          @keyframes fall {
            to {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `}
      </style>
      
      <Confetti />
      
      <h1 style={styles.title}>🎉 Game Over! 🎉</h1>
      <p style={styles.subtitle}>Congratulations to all players!</p>

      {/* Podium for top 3 */}
      {topThree.length > 0 && (
        <div style={styles.podiumContainer}>
          {topThree.map((player, index) => (
            <div key={player.username} style={styles.podiumPosition}>
              <div style={getPodiumStyles(index)}>
                {index === 0 && <div style={styles.crown}>👑</div>}
                <div style={styles.playerName}>{player.username}</div>
                <div style={styles.playerScore}>{player.score} pts</div>
              </div>
              <div style={getBaseStyles(index)}>
                {getPositionText(index)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Remaining players */}
      {remainingPlayers.length > 0 && (
        <div style={styles.remainingPlayersCard}>
          <h3 style={styles.remainingTitle}>Other Players</h3>
          {remainingPlayers.map((player, index) => (
            <div key={player.username} style={styles.remainingPlayer}>
              <div style={styles.remainingPosition}>
                {getPositionText(index + 3)}
              </div>
              <div style={styles.remainingName}>{player.username}</div>
              <div style={styles.remainingScore}>{player.score} pts</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.buttonContainer}>
        <button style={{...styles.button, ...styles.restartButton}} onClick={handleRestart}>
          🎮 Play Again
        </button>
        <button style={{...styles.button, ...styles.newGameButton}} onClick={handleNewGame}>
          🏠 New Game
        </button>
      </div>
    </div>
  );
}

export default GameOverPage; 