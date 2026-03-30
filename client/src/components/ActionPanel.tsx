import type { GameState, Player } from '../types';
import './ActionPanel.css';

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isActivePlayer: boolean;
  isMyTurn: boolean;
  onDraw: () => void;
  onStopDrawing: () => void;
  onPass: () => void;
  onUseGambler: () => void;
}

export default function ActionPanel({
  gameState,
  localPlayer,
  isActivePlayer,
  isMyTurn,
  onDraw,
  onStopDrawing,
  onPass,
  onUseGambler,
}: Props) {
  const { phase, busted, cardsCanTake, cardsTaken } = gameState;

  const activePlayer = gameState.players.find(p => p.id === gameState.activePlayerId);
  const currentTurnPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);

  const hasGambler = localPlayer.professions.some(p => p.profession === 'gambler');

  const showYourTurnBanner = isMyTurn || (isActivePlayer && phase === 'discover');

  return (
    <div className={`action-panel ${showYourTurnBanner ? 'action-panel--your-turn' : ''}`}>
      {showYourTurnBanner && (
        <div className="action-panel__your-turn-banner">YOUR TURN</div>
      )}
      <div className="action-panel__status">
        {busted ? (
          <span className="action-panel__status--bust">BUSTED!</span>
        ) : (
          <>
            <span className="action-panel__phase">{phaseLabel(phase)}</span>
            {phase === 'trade_hire' && isMyTurn && (
              <span className="action-panel__cards-info">
                Your turn — {cardsCanTake - cardsTaken} of {cardsCanTake} card(s) to take
              </span>
            )}
            {phase === 'trade_hire' && !isMyTurn && (
              <span className="action-panel__cards-info">
                {currentTurnPlayer?.name} is trading/hiring…
              </span>
            )}
            {phase === 'discover' && isActivePlayer && (
              <span className="action-panel__cards-info">Your turn to draw</span>
            )}
            {phase === 'discover' && !isActivePlayer && (
              <span className="action-panel__cards-info">
                {activePlayer?.name} is drawing…
              </span>
            )}
            {phase === 'other_players_turn' && isMyTurn && (
              <span className="action-panel__cards-info">Your turn — take 1 card from the harbor</span>
            )}
            {phase === 'other_players_turn' && !isMyTurn && (
              <span className="action-panel__cards-info">
                {currentTurnPlayer?.name}'s harbor turn…
              </span>
            )}
          </>
        )}
      </div>

      <div className="action-panel__buttons">
        {phase === 'discover' && isActivePlayer && !busted && (
          <>
            <button className="primary" onClick={onDraw}>
              Draw Card
            </button>
            <button onClick={onStopDrawing}>Stop Drawing</button>
            {hasGambler && (
              <button onClick={onUseGambler} title="Draw 4 cards at once">
                Use Gambler
              </button>
            )}
          </>
        )}

        {phase === 'discover' && isActivePlayer && busted && (
          <button onClick={onPass}>End Turn</button>
        )}

        {phase === 'trade_hire' && isMyTurn && (
          <button onClick={onPass}>
            {cardsTaken >= cardsCanTake ? 'Done' : 'Skip Turn'}
          </button>
        )}

        {phase === 'other_players_turn' && isMyTurn && (
          <button onClick={onPass}>
            {cardsTaken >= cardsCanTake ? 'Done' : 'Skip Turn'}
          </button>
        )}

        {!isMyTurn && !isActivePlayer && (
          <div className="action-panel__waiting">Waiting for other players…</div>
        )}
      </div>

      <div className="action-panel__deck-info">
        <span>Deck: {gameState.deckCount} cards</span>
      </div>
    </div>
  );
}

function phaseLabel(phase: GameState['phase']) {
  switch (phase) {
    case 'discover': return 'Phase 1: Discover';
    case 'trade_hire': return 'Phase 2: Trade & Hire';
    case 'other_players_turn': return 'Other Players\' Turn';
    default: return '';
  }
}
