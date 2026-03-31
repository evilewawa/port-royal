import type { ProfessionType } from '../types';

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

// ── Default config ─────────────────────────────────────────────────────────
// Edit these values to change card stats globally.
// 'trader' count is per color (×5 colors = ×5 in the deck).

export const DEFAULT_CONFIG: GameConfig = {
  startingCoins: 3,
  winInfluence: 12,

  professions: {
    sailor:   { name: 'Sailor',             cost: 2, influence: 1, count: 10 },
    pirate:   { name: 'Pirate',             cost: 4, influence: 2, count: 3  },
    trader:   { name: 'Trader',             cost: 3, influence: 1, count: 1  }, // per color
    senorita: { name: 'Señorita',           cost: 3, influence: 1, count: 4  },
    jester:   { name: 'Jester',             cost: 3, influence: 1, count: 5  },
    priest:   { name: 'Priest',             cost: 3, influence: 1, count: 5  },
    settler:  { name: 'Settler',            cost: 3, influence: 1, count: 5  },
    jack:     { name: 'Jack of all Trades', cost: 5, influence: 2, count: 2  },
    captain:  { name: 'Captain',            cost: 5, influence: 2, count: 5  },
    admiral:  { name: 'Admiral',            cost: 7, influence: 2, count: 4  },
    governor: { name: 'Governor',           cost: 8, influence: 2, count: 4  },
    gambler:   { name: 'Gambler',            cost: 4, influence: 2, count: 4  },
    cannoneer: { name: 'Cannoneer',          cost: 5, influence: 2, count: 3  },
  } as Record<ProfessionType, ProfessionConfig>,

  expeditions: [
    { influence: 3, coinReward: 2, requirements: { priest: 1, captain: 1 } },
    { influence: 4, coinReward: 3, requirements: { settler: 1, captain: 1 } },
    { influence: 2, coinReward: 2, requirements: { priest: 1, settler: 1 } },
    { influence: 5, coinReward: 4, requirements: { priest: 1, settler: 1, captain: 1 } },
    { influence: 3, coinReward: 2, requirements: { settler: 2 } },
    { influence: 4, coinReward: 3, requirements: { priest: 2 }, minPlayers: 5 },
  ],
};

export function mergeConfig(overrides: Partial<GameConfig>): GameConfig {
  return {
    startingCoins: overrides.startingCoins ?? DEFAULT_CONFIG.startingCoins,
    winInfluence: overrides.winInfluence ?? DEFAULT_CONFIG.winInfluence,
    professions: overrides.professions
      ? { ...DEFAULT_CONFIG.professions, ...overrides.professions }
      : DEFAULT_CONFIG.professions,
    expeditions: (overrides.expeditions && overrides.expeditions.length > 0) ? overrides.expeditions : DEFAULT_CONFIG.expeditions,
  };
}
