import type { Card, ShipColor } from '../types';
import './CardView.css';

interface Props {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  actionLabel?: string;
  disabled?: boolean;
}

const SHIP_COLOR_NAMES: Record<ShipColor, string> = {
  yellow: 'Pinnace',
  blue: 'Flute',
  green: 'Barque',
  red: 'Frigate',
  black: 'Galleon',
};

const PROFESSION_DESCRIPTIONS: Record<string, string> = {
  sailor: '+1 cutlass for repelling ships.',
  pirate: '+2 cutlasses for repelling ships.',
  trader: '+1 coin when trading a matching-color ship.',
  senorita: 'Reduces your hiring cost by 1 coin.',
  jester: 'Earn 1 coin whenever anyone busts, or when you stop on an empty harbor.',
  priest: 'Can be sacrificed to fulfill Expedition requirements.',
  settler: 'Can be sacrificed to fulfill Expedition requirements.',
  captain: 'Can be sacrificed to fulfill Expedition requirements.',
  jack: 'Jack of all Trades: counts as any profession for Expeditions.',
  admiral: 'If harbor has 5+ cards when you stop, gain 2 coins.',
  governor: 'Take 1 extra card from the harbor on your turn.',
  gambler: 'Draw 4 cards at once; if no bust, gain +1 extra take.',
};

export default function CardView({ card, onClick, selected, actionLabel, disabled }: Props) {
  const handleClick = !disabled && onClick ? onClick : undefined;

  if (card.type === 'ship') {
    return (
      <div
        className={`card card--ship card--${card.color} ${selected ? 'card--selected' : ''} ${onClick && !disabled ? 'card--clickable' : ''}`}
        onClick={handleClick}
        title={`${SHIP_COLOR_NAMES[card.color]}: earn ${card.coins} coin(s) when traded, requires ${card.cutlasses} cutlass(es) to repel`}
      >
        <div className="card__header">{SHIP_COLOR_NAMES[card.color]}</div>
        <div className="card__body">
          <div className="card__stat">
            <span className="card__icon">⚔</span>
            <span>{card.cutlasses}</span>
          </div>
          <div className="card__stat">
            <span className="card__icon">🪙</span>
            <span>{card.coins}</span>
          </div>
        </div>
        {card.cannotBeRepelled && <div className="card__badge card__badge--lock">🔒</div>}
        {actionLabel && <div className="card__action-label">{actionLabel}</div>}
      </div>
    );
  }

  if (card.type === 'profession') {
    return (
      <div
        className={`card card--profession ${selected ? 'card--selected' : ''} ${onClick && !disabled ? 'card--clickable' : ''}`}
        onClick={handleClick}
        title={PROFESSION_DESCRIPTIONS[card.profession] ?? card.name}
      >
        <div className="card__header">{card.name}</div>
        <div className="card__body">
          <div className="card__stat">
            <span className="card__icon">💰</span>
            <span>{card.cost}</span>
          </div>
          <div className="card__stat">
            <span className="card__icon">★</span>
            <span>{card.influence}</span>
          </div>
        </div>
        {card.traderColor && (
          <div
            className={`card__badge card__badge--trader card__badge--${card.traderColor}`}
            title={`+1 coin trading ${SHIP_COLOR_NAMES[card.traderColor]}`}
          />
        )}
        {actionLabel && <div className="card__action-label">{actionLabel}</div>}
      </div>
    );
  }

  if (card.type === 'expedition') {
    const reqs = Object.entries(card.requirements)
      .filter(([, v]) => v && v > 0)
      .map(([k, v]) => `${v}x ${k}`)
      .join(', ');
    return (
      <div
        className={`card card--expedition ${selected ? 'card--selected' : ''} ${onClick && !disabled ? 'card--clickable' : ''}`}
        onClick={handleClick}
        title={`Expedition: sacrifice ${reqs || 'no professions'} to earn +${card.coinReward} coin(s) and ${card.influence} influence`}
      >
        <div className="card__header">Expedition</div>
        <div className="card__body">
          <div className="card__stat">
            <span className="card__icon">★</span>
            <span>{card.influence}</span>
          </div>
          <div className="card__stat">
            <span className="card__icon">🪙</span>
            <span>+{card.coinReward}</span>
          </div>
        </div>
        <div className="card__reqs">{reqs || 'No requirements'}</div>
        {actionLabel && <div className="card__action-label">{actionLabel}</div>}
      </div>
    );
  }

  if (card.type === 'tax_increase') {
    return (
      <div className="card card--tax">
        <div className="card__header">Tax!</div>
        <div className="card__body">
          <div className="card__stat">{card.variant === 'max' ? 'Most ⚔' : 'Fewest ★'}</div>
        </div>
      </div>
    );
  }

  return null;
}
