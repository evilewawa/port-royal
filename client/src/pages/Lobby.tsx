import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import './Lobby.css';

export default function Lobby() {
  const { connected, error, createGame, joinGame, loadMock } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (playerName.trim()) createGame(playerName.trim());
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (playerName.trim() && joinId.trim()) joinGame(joinId.trim(), playerName.trim());
  }

  return (
    <div className="lobby">
      <div className="lobby__card">
        <h1 className="lobby__title">Port Royal</h1>
        <p className="lobby__subtitle">Push your luck in the Caribbean</p>

        <div className={`lobby__status ${connected ? 'lobby__status--ok' : 'lobby__status--err'}`}>
          {connected ? 'Connected to server' : 'Connecting to server…'}
        </div>

        {error && <div className="lobby__error">{error}</div>}

        {mode === 'choose' && (
          <div className="lobby__actions">
            <button className="primary" onClick={() => setMode('create')}>
              Create Game
            </button>
            <button onClick={() => setMode('join')}>Join Game</button>
            <button onClick={loadMock} style={{ opacity: 0.6, borderStyle: 'dashed' }}>
              Preview UI (no server)
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form className="lobby__form" onSubmit={handleCreate}>
            <label>Your name</label>
            <input
              autoFocus
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
            />
            <div className="lobby__form-actions">
              <button type="button" onClick={() => setMode('choose')}>Back</button>
              <button className="primary" type="submit" disabled={!connected || !playerName.trim()}>
                Create
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form className="lobby__form" onSubmit={handleJoin}>
            <label>Your name</label>
            <input
              autoFocus
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
            />
            <label>Game ID</label>
            <input
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              placeholder="Enter game ID"
            />
            <div className="lobby__form-actions">
              <button type="button" onClick={() => setMode('choose')}>Back</button>
              <button
                className="primary"
                type="submit"
                disabled={!connected || !playerName.trim() || !joinId.trim()}
              >
                Join
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
