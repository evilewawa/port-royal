export type ShipColor = 'yellow' | 'blue' | 'green' | 'red' | 'black';

export type ProfessionType =
  | 'trader'
  | 'settler'
  | 'captain'
  | 'priest'
  | 'jack'
  | 'sailor'
  | 'pirate'
  | 'senorita'
  | 'jester'
  | 'admiral'
  | 'governor'
  | 'gambler'
  | 'cannoneer';

export interface ShipCard {
  id: string;
  type: 'ship';
  color: ShipColor;
  coins: number;
  cutlasses: number;
  cannotBeRepelled?: boolean;
}

export interface ProfessionCard {
  id: string;
  type: 'profession';
  profession: ProfessionType;
  cost: number;
  influence: number;
  traderColor?: ShipColor;
  name: string;
}

export interface ExpeditionCard {
  id: string;
  type: 'expedition';
  influence: number;
  coinReward: number;
  requirements: {
    priest?: number;
    settler?: number;
    captain?: number;
  };
}

export interface TaxIncreaseCard {
  id: string;
  type: 'tax_increase';
  variant: 'max' | 'min';
}

export type Card = ShipCard | ProfessionCard | ExpeditionCard | TaxIncreaseCard;

export interface Player {
  id: string;
  name: string;
  coins: number;
  influence: number;
  cutlasses: number;
  professions: ProfessionCard[];
  expeditions: ExpeditionCard[];
  color: string;
}

export type GamePhase = 'waiting' | 'number_guess' | 'discover' | 'trade_hire' | 'other_players_turn';

export interface LogEntry {
  id: number;
  text: string;
  kind: 'info' | 'action' | 'bust' | 'warn' | 'system';
}

export interface NumberGuessState {
  guessedPlayerIds: string[];
  targetNumber?: number;
  results?: Array<{ id: string; name: string; guess: number }>;
}

export interface GameState {
  gameId: string;
  players: Player[];
  activePlayerId: string;
  currentTurnPlayerId: string; // during other_players_turn, whose sub-turn it is
  phase: GamePhase;
  harborDisplay: Card[];
  expeditionsOnTable: ExpeditionCard[];
  deckCount: number;
  cardsCanTake: number;
  cardsTaken: number;
  busted: boolean;
  gameOver: boolean;
  winnerId?: string;
  log: LogEntry[];
  lastDrawnShipId?: string;
  numberGuess?: NumberGuessState;
}

export interface ProfessionConfig {
  name: string;
  cost: number;
  influence: number;
  count: number;
}

export interface ExpeditionConfig {
  influence: number;
  coinReward: number;
  requirements: { priest?: number; settler?: number; captain?: number };
  minPlayers?: number;
}

export interface GameConfig {
  professions: Record<string, ProfessionConfig>;
  expeditions: ExpeditionConfig[];
  startingCoins: number;
  winInfluence: number;
}

export const DEFAULT_PROFESSION_CONFIG: Record<string, ProfessionConfig> = {
  sailor:    { name: 'Sailor',             cost: 2, influence: 1, count: 10 },
  pirate:    { name: 'Pirate',             cost: 4, influence: 2, count: 3  },
  trader:    { name: 'Trader',             cost: 3, influence: 1, count: 1  }, // per color
  senorita:  { name: 'Señorita',           cost: 3, influence: 1, count: 4  },
  jester:    { name: 'Jester',             cost: 3, influence: 1, count: 5  },
  priest:    { name: 'Priest',             cost: 3, influence: 1, count: 5  },
  settler:   { name: 'Settler',            cost: 3, influence: 1, count: 5  },
  jack:      { name: 'Jack of all Trades', cost: 5, influence: 2, count: 2  },
  captain:   { name: 'Captain',            cost: 5, influence: 2, count: 5  },
  admiral:   { name: 'Admiral',            cost: 7, influence: 2, count: 4  },
  governor:  { name: 'Governor',           cost: 8, influence: 2, count: 4  },
  gambler:   { name: 'Gambler',            cost: 4, influence: 2, count: 4  },
  cannoneer: { name: 'Cannoneer',          cost: 5, influence: 2, count: 3  },
};

export type ClientAction =
  | { type: 'DRAW_CARD' }
  | { type: 'STOP_DRAWING' }
  | { type: 'REPEL_SHIP'; cardId: string }
  | { type: 'TRADE_SHIP'; cardId: string }
  | { type: 'HIRE_PROFESSION'; cardId: string }
  | { type: 'CLAIM_EXPEDITION'; expeditionId: string; sacrificeIds: string[] }
  | { type: 'PASS_TURN' }
  | { type: 'USE_GAMBLER' }
  | { type: 'GUESS_NUMBER'; value: number };
