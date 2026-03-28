import { useState } from 'react';
import type { Card, ExpeditionCard, GameState, Player, ProfessionCard } from '../types';
import CardView from './CardView';
import ExpeditionClaimModal from './ExpeditionClaimModal';
import './HarborDisplay.css';

interface Props {
  harbor: Card[];
  expeditions: ExpeditionCard[];
  gameState: GameState;
  localPlayer: Player;
  isMyTurn: boolean;
  isActivePlayer: boolean;
  onTradeShip: (cardId: string) => void;
  onHireProfession: (cardId: string) => void;
  onRepelShip: (cardId: string) => void;
  onClaimExpedition: (expeditionId: string, sacrificeIds: string[]) => void;
}

const ELIGIBLE_PROFESSIONS = new Set(['priest', 'settler', 'captain', 'jack']);

export default function HarborDisplay({
  harbor,
  expeditions,
  gameState,
  localPlayer,
  isMyTurn,
  isActivePlayer,
  onTradeShip,
  onHireProfession,
  onRepelShip,
  onClaimExpedition,
}: Props) {
  const [pendingExpedition, setPendingExpedition] = useState<ExpeditionCard | null>(null);

  const canTakeCards =
    isMyTurn &&
    (gameState.phase === 'trade_hire' || gameState.phase === 'other_players_turn') &&
    gameState.cardsTaken < gameState.cardsCanTake;

  const canRepel =
    isActivePlayer &&
    gameState.phase === 'discover' &&
    !gameState.busted;

  const canClaimExpedition = isActivePlayer;

  const eligibleProfessions: ProfessionCard[] = localPlayer.professions.filter(p =>
    ELIGIBLE_PROFESSIONS.has(p.profession)
  );

  function getCardAction(card: Card): { label: string; handler: () => void } | null {
    if (!canTakeCards) return null;
    if (card.type === 'ship') return { label: 'Trade', handler: () => onTradeShip(card.id) };
    if (card.type === 'profession') return { label: 'Hire', handler: () => onHireProfession(card.id) };
    return null;
  }

  function canAfford(card: Card) {
    if (card.type === 'profession') {
      const señoritaCount = localPlayer.professions.filter(p => p.profession === 'senorita').length;
      const cost = Math.max(0, card.cost - señoritaCount);
      return localPlayer.coins >= cost;
    }
    return true;
  }

  function handleConfirmClaim(sacrificeIds: string[]) {
    if (!pendingExpedition) return;
    onClaimExpedition(pendingExpedition.id, sacrificeIds);
    setPendingExpedition(null);
  }

  return (
    <div className="harbor">
      {expeditions.length > 0 && (
        <div className="harbor__expeditions">
          <div className="harbor__section-label">Expeditions</div>
          <div className="harbor__cards">
            {expeditions.map(exp => (
              <CardView
                key={exp.id}
                card={exp}
                onClick={canClaimExpedition ? () => setPendingExpedition(exp) : undefined}
                actionLabel={canClaimExpedition ? 'Claim' : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <div className="harbor__section-label">
        Harbor Display
        {gameState.phase === 'trade_hire' && (
          <span className="harbor__cards-left">
            {gameState.cardsCanTake - gameState.cardsTaken} card(s) left to take
          </span>
        )}
      </div>

      {harbor.length === 0 ? (
        <div className="harbor__empty">No cards in harbor</div>
      ) : (
        <div className="harbor__cards">
          {harbor.map(card => {
            const action = getCardAction(card);
            const affordable = canAfford(card);
            const repellable =
              canRepel &&
              card.type === 'ship' &&
              !card.cannotBeRepelled &&
              localPlayer.cutlasses >= card.cutlasses;

            return (
              <div key={card.id} className="harbor__card-wrapper">
                <CardView
                  card={card}
                  onClick={action && affordable ? action.handler : undefined}
                  actionLabel={action && affordable ? action.label : undefined}
                  disabled={action ? !affordable : false}
                />
                {repellable && (
                  <button
                    className="harbor__repel-btn"
                    onClick={() => onRepelShip(card.id)}
                  >
                    Repel
                  </button>
                )}
                {action && !affordable && (
                  <div className="harbor__cant-afford">Can't afford</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pendingExpedition && (
        <ExpeditionClaimModal
          expedition={pendingExpedition}
          eligibleProfessions={eligibleProfessions}
          onConfirm={handleConfirmClaim}
          onCancel={() => setPendingExpedition(null)}
        />
      )}
    </div>
  );
}
