import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';

const CATEGORIES = [
  'Animals',
  'Countries',
  'Movies',
  'Sports',
  'Food',
  'Technology'
];

function ModeratorPanel({ wordCount, roomCode }) {
  const { socket, room, setRoom } = useContext(GameContext);
  const [words, setWords] = useState(Array(wordCount).fill(''));
  const [categories, setCategories] = useState(Array(wordCount).fill(CATEGORIES[0]));
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Reset form when roomCode changes (new game)
  useEffect(() => {
    setWords(Array(wordCount).fill(''));
    setCategories(Array(wordCount).fill(CATEGORIES[0]));
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

  const handleWordChange = (i, value) => {
    const newWords = [...words];
    newWords[i] = value;
    setWords(newWords);
  };
  const handleCategoryChange = (i, value) => {
    const newCats = [...categories];
    newCats[i] = value;
    setCategories(newCats);
  };

  const handleSubmit = () => {
    if (words.some(w => !w.trim())) {
      setError('Please fill in all words.');
      return;
    }
    setSubmitting(true);
    const wordList = words.map((word, i) => ({ word: word.trim(), category: categories[i] }));
    socket.emit('submitWords', { roomCode, wordList }, (res) => {
      setSubmitting(false);
      if (res.error) setError(res.error);
      else setSubmitted(true);
    });
  };

  const handleStartGame = () => {
    console.log('Starting game for room:', roomCode);
    socket.emit('startGame', { roomCode }, (res) => {
      console.log('Start game response:', res);
      if (res.error) {
        setError(res.error);
      } else {
        // Navigation will be handled by the gameUpdate event listener
        console.log('Game started successfully');
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
    wordRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '12px',
      alignItems: 'center'
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
              👤 {player.username} {player.connected ? '' : '(disconnected)'}
            </div>
          ))}
          <div style={{fontSize: '14px', color: '#666', marginTop: '12px'}}>
            {room?.players?.length || 0} / {room?.settings?.roomSize} players
          </div>
        </div>

        <div style={styles.instructions}>
          Enter {wordCount} words and select a category for each:
        </div>

        {Array.from({ length: wordCount }).map((_, i) => (
          <div key={i} style={styles.wordRow}>
            <span style={{minWidth: '30px', color: '#666', fontSize: '14px'}}>
              {i + 1}.
            </span>
            <input
              type="text"
              placeholder={`Word #${i + 1}`}
              value={words[i]}
              onChange={e => handleWordChange(i, e.target.value)}
              style={{
                ...styles.wordInput,
                backgroundColor: submitted ? '#f5f5f5' : 'white'
              }}
              disabled={submitted}
            />
            <select
              value={categories[i]}
              onChange={e => handleCategoryChange(i, e.target.value)}
              style={{
                ...styles.categorySelect,
                backgroundColor: submitted ? '#f5f5f5' : 'white'
              }}
              disabled={submitted}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        ))}

        {error && <div style={styles.error}>{error}</div>}

        {!submitted && (
          <button 
            onClick={handleSubmit} 
            disabled={submitting || words.some(w => !w.trim())}
            style={{
              ...styles.button,
              ...(submitting || words.some(w => !w.trim()) ? styles.submitButtonDisabled : styles.submitButton)
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Words'}
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