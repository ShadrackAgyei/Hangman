import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';

function LobbyPage() {
  const { socket, user, setUser, room, setRoom, setRoomCode, setGame } = useContext(GameContext);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'create', 'join', 'moderator-lobby', 'player-lobby'
  const [username, setUsername] = useState('');
  const [localRoomCode, setLocalRoomCode] = useState('');
  const [roomSize, setRoomSize] = useState(4);
  const [wordCount, setWordCount] = useState(5);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  // Reset all state when going back to home
  const resetToHome = () => {
    setCurrentView('home');
    setUser(null);
    setRoom(null);
    setRoomCode(null);
    setGame(null);
    setUsername('');
    setLocalRoomCode('');
    setError('');
  };

  // Listen for room updates and game state changes
  React.useEffect(() => {
    const handleRoomUpdate = (roomData) => {
      setRoom(roomData);
      if (roomData && user?.isModerator) {
        setCurrentView('moderator-lobby');
      } else if (roomData && !user?.isModerator) {
        setCurrentView('player-lobby');
      }
    };

    const handleGameUpdate = (gameData) => {
      if (gameData && gameData.state === 'playing') {
        // Pre-load game data to avoid delay
        setGame(gameData);
        navigate('/game');
      }
    };

    const handleRoomClosed = () => {
      setRoom(null);
      setError('Room closed by moderator.');
      setCurrentView('home');
    };

    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('gameUpdate', handleGameUpdate);
    socket.on('roomClosed', handleRoomClosed);
    
    return () => {
      socket.off('roomUpdate', handleRoomUpdate);
      socket.off('gameUpdate', handleGameUpdate);
      socket.off('roomClosed', handleRoomClosed);
    };
  }, [socket, setRoom, user, navigate]);

  // Handle create room
  const handleCreateRoom = () => {
    if (!username) return setError('Enter a username');
    setIsCreating(true);
    socket.emit('createRoom', { username, roomSize, wordCount }, ({ roomCode }) => {
      setUser({ username, isModerator: true });
      setRoomCode(roomCode);
      setLocalRoomCode(roomCode);
      setRoom({ moderator: { username }, players: [], settings: { roomSize, wordCount } });
      setIsCreating(false);
      setCurrentView('moderator-lobby');
    });
  };

  // Handle join room
  const handleJoinRoom = () => {
    if (!username || !localRoomCode) return setError('Enter username and room code');
    socket.emit('joinRoom', { roomCode: localRoomCode.trim().toUpperCase(), username }, (res) => {
      if (res.error) return setError(res.error);
      setUser({ username, isModerator: false });
      setRoomCode(localRoomCode.trim().toUpperCase());
    });
  };

  // Additional check to navigate to game if room state is playing
  React.useEffect(() => {
    if (room && room.state === 'playing') {
      navigate('/game');
    }
  }, [room, navigate]);

  const styles = {
    container: {
      maxWidth: '500px',
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
      maxWidth: '400px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '40px',
      color: '#333'
    },
    button: {
      width: '100%',
      padding: '16px',
      fontSize: '18px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '16px',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    createButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      '&:hover': {
        backgroundColor: '#45a049'
      }
    },
    joinButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      '&:hover': {
        backgroundColor: '#1976D2'
      }
    },
    backButton: {
      backgroundColor: '#f0f0f0',
      color: '#333',
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ddd',
      borderRadius: '6px',
      marginBottom: '16px',
      outline: 'none'
    },
    error: {
      color: '#f44336',
      fontSize: '14px',
      marginBottom: '16px',
      textAlign: 'center'
    },
    roomCode: {
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#4CAF50',
      backgroundColor: '#f0f8f0',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      letterSpacing: '2px'
    },
    playerList: {
      backgroundColor: '#f9f9f9',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    }
  };

  // Home view with two buttons
  if (currentView === 'home') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Multiplayer Hangman</h1>
          <button 
            style={{...styles.button, ...styles.createButton}}
            onClick={() => setCurrentView('create')}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Create Room
          </button>
          <button 
            style={{...styles.button, ...styles.joinButton}}
            onClick={() => setCurrentView('join')}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  // Create room view
  if (currentView === 'create') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <button 
            style={{...styles.button, ...styles.backButton}}
            onClick={resetToHome}
          >
            ← Back
          </button>
          <h2 style={{...styles.title, fontSize: '24px'}}>Create Room</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={styles.input}
          />
          <div style={{display: 'flex', gap: '10px', marginBottom: '16px'}}>
            <div style={{flex: 1}}>
              <label style={{fontSize: '14px', color: '#666'}}>Room Size:</label>
              <input 
                type="number" 
                min={2} 
                max={20} 
                value={roomSize} 
                onChange={e => setRoomSize(Number(e.target.value))}
                style={{...styles.input, marginBottom: '0'}}
              />
            </div>
            <div style={{flex: 1}}>
              <label style={{fontSize: '14px', color: '#666'}}>Words:</label>
              <input 
                type="number" 
                min={1} 
                max={20} 
                value={wordCount} 
                onChange={e => setWordCount(Number(e.target.value))}
                style={{...styles.input, marginBottom: '0'}}
              />
            </div>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button 
            onClick={handleCreateRoom} 
            disabled={isCreating}
            style={{...styles.button, ...styles.createButton}}
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    );
  }

  // Join room view
  if (currentView === 'join') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <button 
            style={{...styles.button, ...styles.backButton}}
            onClick={resetToHome}
          >
            ← Back
          </button>
          <h2 style={{...styles.title, fontSize: '24px'}}>Join Room</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Enter Room Code"
            value={localRoomCode}
            onChange={e => setLocalRoomCode(e.target.value.toUpperCase())}
            style={styles.input}
            maxLength={6}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button 
            onClick={handleJoinRoom}
            style={{...styles.button, ...styles.joinButton}}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  // Moderator lobby view
  if (currentView === 'moderator-lobby' && room) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{...styles.title, fontSize: '24px'}}>Room Created!</h2>
          <div style={styles.roomCode}>
            Room Code: {localRoomCode}
          </div>
          <div style={styles.playerList}>
            <h3 style={{margin: '0 0 12px 0'}}>Players in Lobby:</h3>
            <div style={{marginBottom: '8px'}}>
              <strong>👑 {room.moderator?.username}</strong> (Moderator)
            </div>
            {room.players.map((player, idx) => (
              <div key={idx} style={{marginBottom: '4px'}}>
                👤 {player.username}
              </div>
            ))}
            <div style={{fontSize: '14px', color: '#666', marginTop: '12px'}}>
              {room.players.length} / {room.settings?.roomSize} players
            </div>
          </div>
          <button 
            onClick={() => navigate('/game')}
            style={{...styles.button, ...styles.createButton}}
          >
            Set Up Game
          </button>
        </div>
      </div>
    );
  }

  // Player lobby view
  if (currentView === 'player-lobby' && room) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{...styles.title, fontSize: '24px'}}>Joined Room</h2>
          <div style={styles.roomCode}>
            Room Code: {localRoomCode}
          </div>
          <div style={styles.playerList}>
            <h3 style={{margin: '0 0 12px 0'}}>Players in Lobby:</h3>
            <div style={{marginBottom: '8px'}}>
              <strong>👑 {room.moderator?.username}</strong> (Moderator)
            </div>
            {room.players.map((player, idx) => (
              <div key={idx} style={{marginBottom: '4px'}}>
                👤 {player.username}
              </div>
            ))}
            <div style={{fontSize: '14px', color: '#666', marginTop: '12px'}}>
              {room.players.length} / {room.settings?.roomSize} players
            </div>
          </div>
          <div style={{textAlign: 'center', color: '#666', fontStyle: 'italic'}}>
            Waiting for moderator to start the game...
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}

export default LobbyPage; 