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
  | 'gambler';

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
}

export type GamePhase = 'waiting' | 'discover' | 'trade_hire' | 'other_players_turn';

export interface LogEntry {
  id: number;
  text: string;
  kind: 'info' | 'action' | 'bust' | 'warn' | 'system';
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
}

export type ClientAction =
  | { type: 'DRAW_CARD' }
  | { type: 'STOP_DRAWING' }
  | { type: 'REPEL_SHIP'; cardId: string }
  | { type: 'TRADE_SHIP'; cardId: string }
  | { type: 'HIRE_PROFESSION'; cardId: string }
  | { type: 'CLAIM_EXPEDITION'; expeditionId: string; sacrificeIds: string[] }
  | { type: 'PASS_TURN' }
  | { type: 'USE_GAMBLER' };
