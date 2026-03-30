export type ShipColor = 'yellow' | 'blue' | 'green' | 'red' | 'black';

export type ProfessionType =
  | 'trader' | 'settler' | 'captain' | 'priest' | 'jack'
  | 'sailor' | 'pirate' | 'senorita' | 'jester' | 'admiral'
  | 'governor' | 'gambler';

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
  requirements: { priest?: number; settler?: number; captain?: number };
}

export interface TaxIncreaseCard {
  id: string;
  type: 'tax_increase';
  variant: 'max' | 'min';
}

export type Card = ShipCard | ProfessionCard | ExpeditionCard | TaxIncreaseCard;

// Server-side player (coins as number for simplicity)
export interface ServerPlayer {
  id: string;
  name: string;
  coins: number;
  professions: ProfessionCard[];
  expeditions: ExpeditionCard[];
}

// Client-visible player state
export interface ClientPlayer {
  id: string;
  name: string;
  coins: number;
  influence: number;
  cutlasses: number;
  professions: ProfessionCard[];
  expeditions: ExpeditionCard[];
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

export interface ClientGameState {
  gameId: string;
  players: ClientPlayer[];
  activePlayerId: string;
  currentTurnPlayerId: string;
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
