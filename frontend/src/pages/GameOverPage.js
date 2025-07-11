import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';

function GameOverPage() {
  const { scoreboard } = useContext(GameContext);
  const navigate = useNavigate();

  const handleNewGame = () => {
    navigate('/');
  };

  // Sort players by score (highest first)
  const sortedPlayers = [...scoreboard].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);
  const remainingPlayers = sortedPlayers.slice(3);

  const styles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      textAlign: 'center'
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      marginBottom: '10px',
      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
    },
    subtitle: {
      fontSize: '20px',
      color: '#666',
      marginBottom: '40px'
    },
    podiumContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'end',
      gap: '20px',
      marginBottom: '40px',
      flexWrap: 'wrap'
    },
    podiumPosition: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    },
    podiumPlayer: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '10px',
      minWidth: '150px',
      position: 'relative'
    },
    firstPlace: {
      order: 2,
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: 'white',
      transform: 'scale(1.1)'
    },
    secondPlace: {
      order: 1,
      background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
      color: 'white'
    },
    thirdPlace: {
      order: 3,
      background: 'linear-gradient(135deg, #CD7F32, #B8860B)',
      color: 'white'
    },
    podiumBase: {
      width: '120px',
      borderRadius: '8px 8px 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'white'
    },
    firstBase: {
      height: '80px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      order: 2
    },
    secondBase: {
      height: '60px',
      background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
      order: 1
    },
    thirdBase: {
      height: '40px',
      background: 'linear-gradient(135deg, #CD7F32, #B8860B)',
      order: 3
    },
    crown: {
      position: 'absolute',
      top: '-15px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '30px'
    },
    playerName: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    playerScore: {
      fontSize: '24px',
      fontWeight: 'bold'
    },
    remainingPlayersCard: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      maxWidth: '500px',
      margin: '0 auto 30px auto'
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
      padding: '12px 0',
      borderBottom: '1px solid #eee'
    },
    remainingPosition: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#666',
      minWidth: '40px'
    },
    remainingName: {
      fontSize: '16px',
      flex: 1,
      textAlign: 'left',
      marginLeft: '15px'
    },
    remainingScore: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333'
    },
    buttonContainer: {
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },
    button: {
      padding: '15px 30px',
      fontSize: '18px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '150px'
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

  return (
    <div style={styles.container}>
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
        <button 
          onClick={handleNewGame}
          style={{...styles.button, ...styles.newGameButton}}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
        >
          🏠 New Game
        </button>
      </div>
    </div>
  );
}

export default GameOverPage; 