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

export default function CardView({ card, onClick, selected, actionLabel, disabled }: Props) {
  const handleClick = !disabled && onClick ? onClick : undefined;

  if (card.type === 'ship') {
    return (
      <div
        className={`card card--ship card--${card.color} ${selected ? 'card--selected' : ''} ${onClick && !disabled ? 'card--clickable' : ''}`}
        onClick={handleClick}
        title={actionLabel}
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
        title={actionLabel}
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
          <div className={`card__badge card__badge--trader card__badge--${card.traderColor}`}>
            {SHIP_COLOR_NAMES[card.traderColor]}
          </div>
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
        title={actionLabel}
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
