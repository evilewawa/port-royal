import type { GameState } from '../types';
import './WaitingRoom.css';

interface Props {
  gameState: GameState;
  playerId: string;
  onStart: () => void;
}

export default function WaitingRoom({ gameState, playerId, onStart }: Props) {
  const isHost = gameState.players[0]?.id === playerId;
  const canStart = gameState.players.length >= 2;

  return (
    <div className="waiting-room">
      <div className="waiting-room__card">
        <h2>Waiting for players</h2>
        <div className="waiting-room__game-id">
          Game ID: <strong>{gameState.gameId}</strong>
          <span className="waiting-room__hint">Share this with friends</span>
        </div>

        <div className="waiting-room__players">
          {gameState.players.map((p, i) => (
            <div key={p.id} className="waiting-room__player">
              <span>{p.name}</span>
              {i === 0 && <span className="waiting-room__host-badge">Host</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 2 - gameState.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="waiting-room__player waiting-room__player--empty">
              Waiting…
            </div>
          ))}
        </div>

        {isHost ? (
          <button className="primary" onClick={onStart} disabled={!canStart}>
            {canStart ? 'Start Game' : 'Need at least 2 players'}
          </button>
        ) : (
          <p className="waiting-room__waiting-msg">Waiting for host to start the game…</p>
        )}
      </div>
    </div>
  );
}
