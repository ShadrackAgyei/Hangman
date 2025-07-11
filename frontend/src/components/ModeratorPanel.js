import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';

function ModeratorPanel({ wordCount, roomCode }) {
  const { socket, room, setRoom } = useContext(GameContext);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load available categories when component mounts
  useEffect(() => {
    socket.emit('getCategories', ({ categories }) => {
      setAvailableCategories(categories);
      setLoading(false);
    });
  }, [socket]);

  // Reset form when roomCode changes (new game)
  useEffect(() => {
    setSelectedCategories([]);
    setError('');
    setSubmitted(false);
    setSubmitting(false);
  }, [roomCode, wordCount]);

  // Listen for room updates to keep player list current
  useEffect(() => {
    const handleRoomUpdate = (roomData) => {
      setRoom(roomData);
    };

    socket.on('roomUpdate', handleRoomUpdate);
    return () => {
      socket.off('roomUpdate', handleRoomUpdate);
    };
  }, [socket, setRoom]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one category.');
      return;
    }
    setSubmitting(true);
    socket.emit('submitCategories', { roomCode, categories: selectedCategories, wordCount }, (res) => {
      setSubmitting(false);
      if (res.error) setError(res.error);
      else setSubmitted(true);
    });
  };

  const handleStartGame = () => {
    socket.emit('startGame', { roomCode }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        // Navigation will be handled by the gameUpdate event listener
      }
    });
  };

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    },
    card: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '550px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '20px',
      color: '#333'
    },
    roomCode: {
      fontSize: '20px',
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#4CAF50',
      backgroundColor: '#f0f8f0',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '20px',
      letterSpacing: '1px'
    },
    playerList: {
      backgroundColor: '#f9f9f9',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '30px'
    },
    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      marginBottom: '20px'
    },
    categoryOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '2px solid transparent'
    },
    categoryOptionSelected: {
      backgroundColor: '#e3f2fd',
      borderColor: '#2196F3'
    },
    wordInput: {
      flex: 2,
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ddd',
      borderRadius: '6px',
      outline: 'none'
    },
    categorySelect: {
      flex: 1,
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ddd',
      borderRadius: '6px',
      outline: 'none'
    },
    hintInput: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ddd',
      borderRadius: '6px',
      outline: 'none'
    },
    button: {
      width: '100%',
      padding: '16px',
      fontSize: '18px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'all 0.3s ease'
    },
    submitButton: {
      backgroundColor: '#2196F3',
      color: 'white'
    },
    submitButtonDisabled: {
      backgroundColor: '#ccc',
      color: '#666',
      cursor: 'not-allowed'
    },
    startButton: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    startButtonDisabled: {
      backgroundColor: '#ccc',
      color: '#666',
      cursor: 'not-allowed'
    },
    error: {
      color: '#f44336',
      fontSize: '14px',
      marginTop: '10px',
      textAlign: 'center'
    },
    instructions: {
      color: '#666',
      fontSize: '16px',
      textAlign: 'center',
      marginBottom: '20px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Game Setup</h2>
        <div style={styles.roomCode}>
          Room Code: {roomCode}
        </div>
        
        <div style={styles.playerList}>
          <h3 style={{margin: '0 0 12px 0'}}>Players in Lobby:</h3>
          <div style={{marginBottom: '8px'}}>
            <strong>👑 {room?.moderator?.username}</strong> (Moderator)
          </div>
          {room?.players?.map((player, idx) => (
            <div key={idx} style={{marginBottom: '4px'}}>
              👤 {player.username}
            </div>
          ))}
          <div style={{fontSize: '14px', color: '#666', marginTop: '12px'}}>
            {room?.players?.length || 0} / {room?.settings?.roomSize} players
          </div>
        </div>

        {loading ? (
          <div style={styles.instructions}>
            Loading categories...
          </div>
        ) : (
          <>
            <div style={styles.instructions}>
              Select categories for the game to randomly choose {wordCount} words from:
            </div>

            <div style={styles.categoryGrid}>
              {availableCategories.map(category => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <div
                    key={category}
                    style={{
                      ...styles.categoryOption,
                      ...(isSelected ? styles.categoryOptionSelected : {}),
                      ...(submitted ? { cursor: 'not-allowed', opacity: 0.6 } : {})
                    }}
                    onClick={() => !submitted && handleCategoryToggle(category)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      disabled={submitted}
                      style={{ pointerEvents: 'none' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: isSelected ? 'bold' : 'normal' }}>
                      {category}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedCategories.length > 0 && (
              <div style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
                Selected: {selectedCategories.join(', ')}
              </div>
            )}
          </>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {!submitted && !loading && (
          <button 
            onClick={handleSubmit} 
            disabled={submitting || selectedCategories.length === 0}
            style={{
              ...styles.button,
              ...(submitting || selectedCategories.length === 0 ? styles.submitButtonDisabled : styles.submitButton)
            }}
          >
            {submitting ? 'Generating Words...' : 'Generate Random Words'}
          </button>
        )}

        {submitted && (
          <button 
            onClick={handleStartGame}
            style={{
              ...styles.button,
              ...styles.startButton
            }}
          >
            🎮 Start Game
          </button>
        )}
      </div>
    </div>
  );
}

export default ModeratorPanel; 