import { useState } from 'react';
import type { Player } from '../types';
import CardView from './CardView';
import './PlayerDisplay.css';

interface Props {
  player: Player;
  isLocal?: boolean;
  isActive?: boolean;
  isCurrentTurn?: boolean;
}

export default function PlayerDisplay({ player, isLocal, isActive, isCurrentTurn }: Props) {
  const [hovered, setHovered] = useState(false);
  const hasCards = player.professions.length > 0 || player.expeditions.length > 0;

  return (
    <div
      className={[
        'player-display',
        isLocal ? 'player-display--local' : '',
        isActive ? 'player-display--active' : '',
        isCurrentTurn ? 'player-display--current-turn' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => !isLocal && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="player-display__header">
        <span className="player-display__name" style={{ '--player-color': player.color } as React.CSSProperties}>
          <span style={{ color: player.color }}>{player.name}</span>{isLocal ? ' (you)' : ''}
          {isCurrentTurn && <span className="player-display__turn-badge">TURN</span>}
          {!isLocal && hasCards && <span className="player-display__peek-hint"> ({player.professions.length + player.expeditions.length} cards)</span>}
        </span>
        <div className="player-display__stats">
          <span title="Coins">🪙 {player.coins}</span>
          <span title="Influence">★ {player.influence}</span>
          <span title="Cutlasses">⚔ {player.cutlasses}</span>
        </div>
      </div>

      {isLocal && (
        <div className="player-display__cards">
          {!hasCards ? (
            <div className="player-display__empty">No cards yet</div>
          ) : (
            <>
              {player.professions.map(card => (
                <CardView key={card.id} card={card} />
              ))}
              {player.expeditions.map(card => (
                <CardView key={card.id} card={card} />
              ))}
            </>
          )}
        </div>
      )}

      {!isLocal && hovered && (
        <div className="player-display__popover">
          {!hasCards ? (
            <div className="player-display__empty">No cards yet</div>
          ) : (
            <div className="player-display__cards">
              {player.professions.map(card => (
                <CardView key={card.id} card={card} />
              ))}
              {player.expeditions.map(card => (
                <CardView key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
