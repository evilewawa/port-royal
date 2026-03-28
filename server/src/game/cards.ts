import type { Card, ShipCard, ProfessionCard, ExpeditionCard, TaxIncreaseCard, ShipColor, ProfessionType } from '../types';

let _id = 0;
function id() { return `c${++_id}`; }

function ship(color: ShipColor, coins: number, cutlasses: number, cannotBeRepelled?: boolean): ShipCard {
  return { id: id(), type: 'ship', color, coins, cutlasses, cannotBeRepelled };
}

function prof(profession: ProfessionType, name: string, cost: number, influence: number, traderColor?: ShipColor): ProfessionCard {
  return { id: id(), type: 'profession', profession, name, cost, influence, traderColor };
}

function expedition(influence: number, coinReward: number, requirements: ExpeditionCard['requirements']): ExpeditionCard {
  return { id: id(), type: 'expedition', influence, coinReward, requirements };
}

function tax(variant: 'max' | 'min'): TaxIncreaseCard {
  return { id: id(), type: 'tax_increase', variant };
}

export function buildDeck(playerCount: number): Card[] {
  const cards: Card[] = [
    // --- Yellow Pinnace (10) ---
    ship('yellow', 1, 1), ship('yellow', 1, 2),
    ship('yellow', 2, 1), ship('yellow', 2, 2), ship('yellow', 2, 3),
    ship('yellow', 3, 2), ship('yellow', 3, 3),
    ship('yellow', 4, 2), ship('yellow', 4, 3), ship('yellow', 4, 4),

    // --- Blue Flute (10) ---
    ship('blue', 1, 1), ship('blue', 2, 2), ship('blue', 2, 3),
    ship('blue', 3, 2), ship('blue', 3, 3), ship('blue', 3, 4),
    ship('blue', 4, 3), ship('blue', 4, 5),
    ship('blue', 5, 4), ship('blue', 5, 5),

    // --- Green Barque (10) ---
    ship('green', 1, 2), ship('green', 2, 2), ship('green', 2, 3),
    ship('green', 3, 3), ship('green', 3, 4),
    ship('green', 4, 3), ship('green', 4, 4), ship('green', 4, 5),
    ship('green', 5, 4), ship('green', 5, 5),

    // --- Red Frigate (10) ---
    ship('red', 2, 2), ship('red', 2, 3),
    ship('red', 3, 3), ship('red', 3, 4),
    ship('red', 4, 4), ship('red', 4, 5),
    ship('red', 5, 4), ship('red', 5, 5),
    ship('red', 6, 5), ship('red', 6, 6),

    // --- Black Galleon (10) ---
    ship('black', 2, 3), ship('black', 3, 3), ship('black', 3, 4),
    ship('black', 4, 4), ship('black', 4, 5),
    ship('black', 5, 5), ship('black', 5, 6),
    ship('black', 6, 5), ship('black', 6, 7), ship('black', 7, 6),

    // --- Traders (10: 2 per color) ---
    prof('trader', 'Yellow Trader', 3, 1, 'yellow'),
    prof('trader', 'Yellow Trader', 3, 1, 'yellow'),
    prof('trader', 'Blue Trader',   3, 1, 'blue'),
    prof('trader', 'Blue Trader',   3, 1, 'blue'),
    prof('trader', 'Green Trader',  3, 1, 'green'),
    prof('trader', 'Green Trader',  3, 1, 'green'),
    prof('trader', 'Red Trader',    3, 1, 'red'),
    prof('trader', 'Red Trader',    3, 1, 'red'),
    prof('trader', 'Black Trader',  3, 1, 'black'),
    prof('trader', 'Black Trader',  3, 1, 'black'),

    // --- Settlers (5) ---
    prof('settler', 'Settler', 3, 1),
    prof('settler', 'Settler', 3, 1),
    prof('settler', 'Settler', 3, 1),
    prof('settler', 'Settler', 3, 1),
    prof('settler', 'Settler', 3, 1),

    // --- Captains (5) ---
    prof('captain', 'Captain', 5, 2),
    prof('captain', 'Captain', 5, 2),
    prof('captain', 'Captain', 5, 2),
    prof('captain', 'Captain', 5, 2),
    prof('captain', 'Captain', 5, 2),

    // --- Priests (5) ---
    prof('priest', 'Priest', 3, 1),
    prof('priest', 'Priest', 3, 1),
    prof('priest', 'Priest', 3, 1),
    prof('priest', 'Priest', 3, 1),
    prof('priest', 'Priest', 3, 1),

    // --- Jacks of all Trades (3) ---
    prof('jack', 'Jack of all Trades', 5, 2),
    prof('jack', 'Jack of all Trades', 5, 2),
    prof('jack', 'Jack of all Trades', 5, 2),

    // --- Sailors (10) ---
    ...Array.from({ length: 10 }, () => prof('sailor', 'Sailor', 2, 1)),

    // --- Pirates (3) ---
    prof('pirate', 'Pirate', 4, 2),
    prof('pirate', 'Pirate', 4, 2),
    prof('pirate', 'Pirate', 4, 2),

    // --- Señoritas (4) ---
    prof('senorita', 'Señorita', 3, 1),
    prof('senorita', 'Señorita', 3, 1),
    prof('senorita', 'Señorita', 3, 1),
    prof('senorita', 'Señorita', 3, 1),

    // --- Jesters (5) ---
    prof('jester', 'Jester', 3, 1),
    prof('jester', 'Jester', 3, 1),
    prof('jester', 'Jester', 3, 1),
    prof('jester', 'Jester', 3, 1),
    prof('jester', 'Jester', 3, 1),

    // --- Admirals (6) ---
    prof('admiral', 'Admiral', 6, 2),
    prof('admiral', 'Admiral', 6, 2),
    prof('admiral', 'Admiral', 6, 2),
    prof('admiral', 'Admiral', 6, 2),
    prof('admiral', 'Admiral', 6, 2),
    prof('admiral', 'Admiral', 6, 2),

    // --- Governors (4) ---
    prof('governor', 'Governor', 6, 2),
    prof('governor', 'Governor', 6, 2),
    prof('governor', 'Governor', 6, 2),
    prof('governor', 'Governor', 6, 2),

    // --- Expeditions (5 base, +1 for 5 players) ---
    expedition(3, 2, { priest: 1, captain: 1 }),
    expedition(4, 3, { settler: 1, captain: 1 }),
    expedition(2, 2, { priest: 1, settler: 1 }),
    expedition(5, 4, { priest: 1, settler: 1, captain: 1 }),
    expedition(3, 2, { settler: 2 }),
    ...(playerCount === 5 ? [expedition(4, 3, { priest: 2 })] : []),

    // --- Tax Increase (4) ---
    tax('max'), tax('max'),
    tax('min'), tax('min'),
  ];

  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
