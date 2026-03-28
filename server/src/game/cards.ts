import type { Card, ShipCard, ShipColor, ProfessionType } from '../types';
import type { GameConfig } from './cardConfig';

function ship(color: ShipColor, coins: number, cutlasses: number): ShipCard {
  return { id: `${color}-${coins}-${cutlasses}-${Math.random().toString(36).slice(2)}`, type: 'ship', color, coins, cutlasses };
}

export function buildDeck(playerCount: number, config: GameConfig): Card[] {
  const p = config.professions;

  // Helper to build N profession cards of a given type
  function profs(type: ProfessionType, traderColor?: ShipColor): Card[] {
    const def = p[type];
    if (!def) return [];
    return Array.from({ length: def.count }, (_, i) => ({
      id: `${type}-${traderColor ?? ''}-${i}-${Math.random().toString(36).slice(2)}`,
      type: 'profession' as const,
      profession: type,
      name: traderColor ? `${capitalize(traderColor)} Trader` : def.name,
      cost: def.cost,
      influence: def.influence,
      ...(traderColor ? { traderColor } : {}),
    }));
  }

  const cards: Card[] = [
    // ── Ships (fixed distribution, 10 per color) ────────────────────────────
    ship('yellow', 1, 1), ship('yellow', 1, 2),
    ship('yellow', 2, 1), ship('yellow', 2, 2), ship('yellow', 2, 3),
    ship('yellow', 3, 2), ship('yellow', 3, 3),
    ship('yellow', 4, 2), ship('yellow', 4, 3), ship('yellow', 4, 4),

    ship('blue', 1, 1), ship('blue', 2, 2), ship('blue', 2, 3),
    ship('blue', 3, 2), ship('blue', 3, 3), ship('blue', 3, 4),
    ship('blue', 4, 3), ship('blue', 4, 5),
    ship('blue', 5, 4), ship('blue', 5, 5),

    ship('green', 1, 2), ship('green', 2, 2), ship('green', 2, 3),
    ship('green', 3, 3), ship('green', 3, 4),
    ship('green', 4, 3), ship('green', 4, 4), ship('green', 4, 5),
    ship('green', 5, 4), ship('green', 5, 5),

    ship('red', 2, 2), ship('red', 2, 3),
    ship('red', 3, 3), ship('red', 3, 4),
    ship('red', 4, 4), ship('red', 4, 5),
    ship('red', 5, 4), ship('red', 5, 5),
    ship('red', 6, 5), ship('red', 6, 6),

    ship('black', 2, 3), ship('black', 3, 3), ship('black', 3, 4),
    ship('black', 4, 4), ship('black', 4, 5),
    ship('black', 5, 5), ship('black', 5, 6),
    ship('black', 6, 5), ship('black', 6, 7), ship('black', 7, 6),

    // ── Professions ─────────────────────────────────────────────────────────
    ...profs('trader', 'yellow'),
    ...profs('trader', 'blue'),
    ...profs('trader', 'green'),
    ...profs('trader', 'red'),
    ...profs('trader', 'black'),
    ...profs('settler'),
    ...profs('captain'),
    ...profs('priest'),
    ...profs('jack'),
    ...profs('sailor'),
    ...profs('pirate'),
    ...profs('senorita'),
    ...profs('jester'),
    ...profs('admiral'),
    ...profs('governor'),

    // ── Expeditions ──────────────────────────────────────────────────────────
    ...config.expeditions
      .filter(e => !e.minPlayers || playerCount >= e.minPlayers)
      .map((e, i) => ({
        id: `exp-${i}-${Math.random().toString(36).slice(2)}`,
        type: 'expedition' as const,
        influence: e.influence,
        coinReward: e.coinReward,
        requirements: e.requirements,
      })),

    // ── Tax Increase (4) ────────────────────────────────────────────────────
    { id: 'tax-max-0', type: 'tax_increase' as const, variant: 'max' as const },
    { id: 'tax-max-1', type: 'tax_increase' as const, variant: 'max' as const },
    { id: 'tax-min-0', type: 'tax_increase' as const, variant: 'min' as const },
    { id: 'tax-min-1', type: 'tax_increase' as const, variant: 'min' as const },
  ];

  return shuffle(cards);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
