import { useSocket } from '../context/SocketContext';
import WaitingRoom from '../components/WaitingRoom';
import GameLog from '../components/GameLog';
import CardInfoModal from '../components/CardInfoModal';
import NumberGuessPhase from '../components/NumberGuessPhase';
import { useState } from 'react';
import HarborDisplay from '../components/HarborDisplay';
import PlayerDisplay from '../components/PlayerDisplay';
import ActionPanel from '../components/ActionPanel';
import './GameBoard.css';

export default function GameBoard() {
  const { gameState, playerId, sendAction, startGame } = useSocket();
  const [showCardInfo, setShowCardInfo] = useState(false);

  if (!gameState) return <div className="loading">Loading game…</div>;

  const localPlayer = gameState.players.find(p => p.id === playerId);
  const otherPlayers = gameState.players.filter(p => p.id !== playerId);

  if (!localPlayer) return <div className="loading">Connecting…</div>;

  if (gameState.phase === 'waiting') {
    return <WaitingRoom gameState={gameState} playerId={playerId!} onStart={config => startGame(config)} />;
  }

  if (gameState.phase === 'number_guess') {
    return (
      <NumberGuessPhase
        gameState={gameState}
        localPlayer={localPlayer}
        onGuess={value => sendAction({ type: 'GUESS_NUMBER', value })}
      />
    );
  }

  const isActivePlayer = gameState.activePlayerId === playerId;
  const isMyTurn = gameState.currentTurnPlayerId === playerId;

  if (gameState.gameOver) {
    const winner = gameState.players.find(p => p.id === gameState.winnerId);
    return (
      <div className="game-over">
        <h2>Game Over!</h2>
        <p>{winner ? `${winner.name} wins with ${winner.influence} influence!` : 'Game ended.'}</p>
        <div className="game-over__scores">
          {[...gameState.players]
            .sort((a, b) => b.influence - a.influence)
            .map(p => (
              <div key={p.id} className={`game-over__row ${p.id === gameState.winnerId ? 'game-over__row--winner' : ''}`}>
                <span>{p.name}</span>
                <span>★ {p.influence}</span>
                <span>🪙 {p.coins}</span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="game-board__top">
        {otherPlayers.map(p => (
          <PlayerDisplay
            key={p.id}
            player={p}
            isLocal={false}
            isActive={p.id === gameState.activePlayerId}
            isCurrentTurn={p.id === gameState.currentTurnPlayerId}
          />
        ))}
      </div>

      <div className="game-board__center">
        <HarborDisplay
          harbor={gameState.harborDisplay}
          expeditions={gameState.expeditionsOnTable}
          gameState={gameState}
          localPlayer={localPlayer}
          isMyTurn={isMyTurn}
          isActivePlayer={isActivePlayer}
          onTradeShip={id => sendAction({ type: 'TRADE_SHIP', cardId: id })}
          onHireProfession={id => sendAction({ type: 'HIRE_PROFESSION', cardId: id })}
          onRepelShip={id => sendAction({ type: 'REPEL_SHIP', cardId: id })}
          onClaimExpedition={(id, sacrificeIds) => sendAction({ type: 'CLAIM_EXPEDITION', expeditionId: id, sacrificeIds })}
        />

        <div className="game-board__side">
          <ActionPanel
            gameState={gameState}
            localPlayer={localPlayer}
            isActivePlayer={isActivePlayer}
            isMyTurn={isMyTurn}
            onDraw={() => sendAction({ type: 'DRAW_CARD' })}
            onStopDrawing={() => sendAction({ type: 'STOP_DRAWING' })}
            onPass={() => sendAction({ type: 'PASS_TURN' })}
            onUseGambler={() => sendAction({ type: 'USE_GAMBLER' })}
          />

          <div className="game-board__game-id">
            <span>Game: <strong>{gameState.gameId}</strong></span>
            <button className="game-board__info-btn" onClick={() => setShowCardInfo(true)} title="Card reference">?</button>
          </div>

          <GameLog entries={gameState.log ?? []} />
        </div>
      </div>

      <div className="game-board__bottom">
        <PlayerDisplay
          player={localPlayer}
          isLocal
          isActive={isActivePlayer}
          isCurrentTurn={isMyTurn}
        />
      </div>

      {showCardInfo && <CardInfoModal onClose={() => setShowCardInfo(false)} />}
    </div>
  );
}
