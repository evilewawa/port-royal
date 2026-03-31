import { buildDeck, shuffle } from './cards';
import { DEFAULT_CONFIG, mergeConfig } from './cardConfig';
import type { GameConfig } from './cardConfig';
import type {
  Card, ShipCard, ProfessionCard, ExpeditionCard,
  ServerPlayer, ClientPlayer, ClientGameState, ClientAction, LogEntry, NumberGuessState,
} from '../types';

const PLAYER_COLORS = ['#ff9a5c', '#5cb8ff', '#a8ff78', '#ff5ca8', '#c85cff'];

const SHIP_NAME: Record<string, string> = {
  yellow: 'Yellow Pinnace',
  blue: 'Blue Flute',
  green: 'Green Barque',
  red: 'Red Frigate',
  black: 'Black Galleon',
};

export class GameRoom {
  readonly id: string;
  private players: ServerPlayer[] = [];
  private playerOrder: string[] = [];
  private started = false;

  private deck: Card[] = [];
  private discard: Card[] = [];
  private harborDisplay: Card[] = [];
  private expeditionsOnTable: ExpeditionCard[] = [];

  private activePlayerIndex = 0;
  private phase: 'waiting' | 'number_guess' | 'discover' | 'trade_hire' | 'other_players_turn' = 'waiting';
  private busted = false;
  private cardsCanTake = 1;
  private cardsTaken = 0;
  private otherPlayersTurnQueue: string[] = [];
  private currentTurnPlayerId = '';

  private gamblerUsedThisTurn = false;
  private gameOver = false;
  private winnerId?: string;
  private config: GameConfig = DEFAULT_CONFIG;
  private lastDrawnShipId: string | null = null;
  private numberGuessTarget = 0;
  private numberGuesses: Record<string, number> = {};

  private logEntries: LogEntry[] = [];
  private logCounter = 0;

  private broadcastFn: (() => void) | null = null;
  private turnTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(id: string) {
    this.id = id;
  }

  // ── Broadcast / Timer ──────────────────────────────────────────────────────

  setBroadcastFn(fn: () => void): void { this.broadcastFn = fn; }
  private broadcast(): void { this.broadcastFn?.(); }

  private clearTurnTimer(): void {
    if (this.turnTimer) { clearTimeout(this.turnTimer); this.turnTimer = null; }
  }

  private startTurnTimer(playerId: string, delayMs: number, action: ClientAction): void {
    this.clearTurnTimer();
    this.turnTimer = setTimeout(() => {
      this.turnTimer = null;
      try { this.handleAction(playerId, action); this.broadcast(); } catch (_) {}
    }, delayMs);
  }

  // ── Logging ────────────────────────────────────────────────────────────────

  private log(text: string, kind: LogEntry['kind'] = 'info'): void {
    this.logEntries.push({ id: this.logCounter++, text, kind });
    // Keep last 200 entries
    if (this.logEntries.length > 200) this.logEntries.shift();
  }

  // ── Lobby ──────────────────────────────────────────────────────────────────

  addPlayer(socketId: string, name: string): void {
    if (this.started) {
      // Allow reconnection by name
      const existing = this.players.find(p => p.name === name);
      if (existing) {
        const oldId = existing.id;
        existing.id = socketId;
        this.playerOrder = this.playerOrder.map(id => id === oldId ? socketId : id);
        this.otherPlayersTurnQueue = this.otherPlayersTurnQueue.map(id => id === oldId ? socketId : id);
        if (this.currentTurnPlayerId === oldId) this.currentTurnPlayerId = socketId;
        this.log(`${name} reconnected.`, 'system');
        return;
      }
      throw new Error('Game already started');
    }
    if (this.players.length >= 5) throw new Error('Game is full');
    if (this.players.find(p => p.id === socketId)) throw new Error('Already in game');
    const color = PLAYER_COLORS[this.players.length % PLAYER_COLORS.length];
    this.players.push({ id: socketId, name, coins: 0, professions: [], expeditions: [], color });
    this.playerOrder.push(socketId);
    this.log(`${name} joined the game.`, 'system');
  }

  removePlayer(socketId: string): void {
    const p = this.players.find(p => p.id === socketId);
    if (p) this.log(`${p.name} left the game.`, 'system');
    this.players = this.players.filter(p => p.id !== socketId);
    this.playerOrder = this.playerOrder.filter(id => id !== socketId);
  }

  hasPlayer(socketId: string): boolean {
    return this.players.some(p => p.id === socketId);
  }

  isEmpty(): boolean { return this.players.length === 0; }
  canStart(): boolean { return this.players.length >= 2 && !this.started; }

  // ── Game Start ─────────────────────────────────────────────────────────────

  startGame(configOverrides?: Partial<GameConfig>): void {
    if (!this.canStart()) throw new Error('Cannot start game');
    this.started = true;
    this.config = mergeConfig(configOverrides ?? {});
    this.phase = 'number_guess';
    this.numberGuessTarget = Math.floor(Math.random() * 10) + 1;
    this.numberGuesses = {};
    this.log('Before the game starts, each player must guess a number 1–10. Closest to the secret number goes first! Ties are broken alphabetically.', 'system');
  }

  private resolveNumberGuess(): void {
    const target = this.numberGuessTarget;
    const ranked = [...this.players]
      .map(p => ({ p, diff: Math.abs(this.numberGuesses[p.id] - target) }))
      .sort((a, b) => a.diff !== b.diff ? a.diff - b.diff : a.p.name.localeCompare(b.p.name));

    const summary = ranked.map(r => `${r.p.name}: ${this.numberGuesses[r.p.id]}`).join(', ');
    this.log(`Secret number was ${target}! Guesses: ${summary}. ${ranked[0].p.name} goes first!`, 'system');

    this.players = ranked.map(r => r.p);
    this.playerOrder = this.players.map(p => p.id);

    this.deck = buildDeck(this.players.length, this.config);
    for (const p of this.players) p.coins = this.config.startingCoins;
    this.log('Game started! Each player receives 3 coins.', 'system');
    this.activePlayerIndex = 0;
    this.beginDiscoverPhase();
  }

  // ── Phase Transitions ──────────────────────────────────────────────────────

  private beginDiscoverPhase(): void {
    this.phase = 'discover';
    this.busted = false;
    this.harborDisplay = [];
    this.lastDrawnShipId = null;
    this.gamblerUsedThisTurn = false;
    this.currentTurnPlayerId = this.activePlayer.id;
    this.log(`--- ${this.activePlayer.name}'s turn ---`, 'system');
    this.log(`${this.activePlayer.name} begins Phase 1: Discover.`, 'info');
    this.startTurnTimer(this.activePlayer.id, 30000, { type: 'STOP_DRAWING' });
  }

  private beginTradeHirePhase(): void {
    this.phase = 'trade_hire';
    const activeP = this.activePlayer;

    const admiralCount = activeP.professions.filter(p => p.profession === 'admiral').length;
    if (admiralCount > 0 && this.harborDisplay.length >= 5) {
      const bonus = admiralCount * 2;
      activeP.coins += bonus;
      this.log(`${activeP.name}'s Admiral(s) trigger — gains ${bonus} coins (harbor has 5+ cards).`, 'action');
    }

    const jesterCount = activeP.professions.filter(p => p.profession === 'jester').length;
    if (jesterCount > 0 && this.harborDisplay.length === 0) {
      activeP.coins += jesterCount;
      this.log(`${activeP.name}'s Jester(s) trigger — gains ${jesterCount} coin(s) (empty harbor).`, 'action');
    }

    const shipColors = new Set(
      this.harborDisplay.filter(c => c.type === 'ship').map(c => (c as ShipCard).color)
    );
    const differentShips = shipColors.size;
    let base = 1;
    if (differentShips >= 5) base = 3;
    else if (differentShips === 4) base = 2;

    const governorCount = activeP.professions.filter(p => p.profession === 'governor').length;
    this.cardsCanTake = base + governorCount;
    this.cardsTaken = 0;
    this.currentTurnPlayerId = activeP.id;

    this.log(`${activeP.name} begins Phase 2: Trade & Hire (may take ${this.cardsCanTake} card(s)).`, 'info');
    this.startTurnTimer(activeP.id, 30000, { type: 'PASS_TURN' });
  }

  private beginOtherPlayersTurn(): void {
    if (this.harborDisplay.length === 0) {
      for (const p of this.players) {
        if (p.id === this.activePlayer.id) continue;
        const jesters = p.professions.filter(pr => pr.profession === 'jester').length;
        if (jesters > 0) {
          p.coins += jesters;
          this.log(`${p.name}'s Jester(s) trigger — gains ${jesters} coin(s) (empty harbor).`, 'action');
        }
      }
      this.endTurn();
      return;
    }
    this.phase = 'other_players_turn';
    const idx = this.activePlayerIndex;
    const queue: string[] = [];
    for (let i = 1; i < this.players.length; i++) {
      queue.push(this.players[(idx + i) % this.players.length].id);
    }
    this.otherPlayersTurnQueue = queue;
    this.log('Other players may now take 1 card (paying the active player 1 coin).', 'info');
    this.advanceOtherPlayersTurn();
  }

  private advanceOtherPlayersTurn(): void {
    if (this.otherPlayersTurnQueue.length === 0) {
      this.endTurn();
      return;
    }
    const nextId = this.otherPlayersTurnQueue.shift()!;
    const player = this.getPlayer(nextId);
    this.currentTurnPlayerId = nextId;

    if (this.harborDisplay.length === 0) {
      const jesters = player.professions.filter(p => p.profession === 'jester').length;
      if (jesters > 0) {
        player.coins += jesters;
        this.log(`${player.name}'s Jester(s) trigger — gains ${jesters} coin(s) (empty harbor).`, 'action');
      }
      // Trigger remaining players in queue too then end
      for (const id of this.otherPlayersTurnQueue) {
        const p = this.getPlayer(id);
        const j = p.professions.filter(pr => pr.profession === 'jester').length;
        if (j > 0) {
          p.coins += j;
          this.log(`${p.name}'s Jester(s) trigger — gains ${j} coin(s) (empty harbor).`, 'action');
        }
      }
      this.otherPlayersTurnQueue = [];
      this.endTurn();
      return;
    }

    const governorCount = player.professions.filter(p => p.profession === 'governor').length;
    this.cardsCanTake = 1 + governorCount;
    this.cardsTaken = 0;
    this.log(`${player.name}'s turn to take a card from the harbor.`, 'info');
    this.startTurnTimer(nextId, 30000, { type: 'PASS_TURN' });
  }

  private endTurn(): void {
    this.clearTurnTimer();
    const discarded = this.harborDisplay.length;
    this.discard.push(...this.harborDisplay);
    this.harborDisplay = [];
    if (discarded > 0) this.log(`${discarded} card(s) discarded from the harbor.`, 'info');

    for (const p of this.players) {
      if (this.computeInfluence(p) >= this.config.winInfluence) {
        this.log(`${p.name} has reached 12 influence — triggering end game!`, 'warn');
        this.triggerEndGame();
        return;
      }
    }

    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
    this.beginDiscoverPhase();
  }

  private triggerEndGame(): void {
    this.gameOver = true;
    let winner = this.players[0];
    for (const p of this.players) {
      const pInf = this.computeInfluence(p);
      const wInf = this.computeInfluence(winner);
      if (pInf > wInf || (pInf === wInf && p.coins > winner.coins)) winner = p;
    }
    this.winnerId = winner.id;
    this.log(`Game over! ${winner.name} wins with ${this.computeInfluence(winner)} influence!`, 'system');
  }

  // ── Action Dispatch ────────────────────────────────────────────────────────

  handleAction(socketId: string, action: ClientAction): void {
    this.clearTurnTimer();
    if (this.gameOver) throw new Error('Game is over');
    switch (action.type) {
      case 'GUESS_NUMBER':     return this.actionGuessNumber(socketId, action.value);
      case 'DRAW_CARD':        return this.actionDraw(socketId);
      case 'STOP_DRAWING':     return this.actionStop(socketId);
      case 'REPEL_SHIP':       return this.actionRepel(socketId, action.cardId);
      case 'TRADE_SHIP':       return this.actionTrade(socketId, action.cardId);
      case 'HIRE_PROFESSION':  return this.actionHire(socketId, action.cardId);
      case 'CLAIM_EXPEDITION': return this.actionClaimExpedition(socketId, action.expeditionId, action.sacrificeIds);
      case 'PASS_TURN':        return this.actionPass(socketId);
      case 'USE_GAMBLER':      return this.actionGambler(socketId);
      default: throw new Error('Unknown action');
    }
  }

  private actionGuessNumber(socketId: string, value: number): void {
    if (this.phase !== 'number_guess') throw new Error('Not in number guess phase');
    if (!this.hasPlayer(socketId)) throw new Error('Player not found');
    if (this.numberGuesses[socketId] !== undefined) throw new Error('Already guessed');
    if (value < 1 || value > 10) throw new Error('Guess must be between 1 and 10');

    this.numberGuesses[socketId] = value;
    const player = this.getPlayer(socketId);
    this.log(`${player.name} has submitted their guess.`, 'info');

    if (Object.keys(this.numberGuesses).length === this.players.length) {
      this.resolveNumberGuess();
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  private actionDraw(socketId: string): void {
    this.assertPhase('discover');
    this.assertActivePlayer(socketId);
    if (this.busted) throw new Error('Already busted');

    const card = this.drawFromDeck();
    if (!card) throw new Error('Deck is empty');

    if (card.type === 'tax_increase') {
      this.log(`Tax Increase drawn! (${card.variant === 'max' ? 'Most cutlasses' : 'Fewest influence'} gains 1 coin)`, 'warn');
      this.resolveTaxIncrease(card);
      this.discard.push(card);
      return;
    }

    if (card.type === 'expedition') {
      const reqs = Object.entries(card.requirements)
        .filter(([, v]) => v && v > 0)
        .map(([k, v]) => `${v}x ${k}`)
        .join(', ');
      this.expeditionsOnTable.push(card);
      this.log(`Expedition revealed (★${card.influence}, +${card.coinReward} coins): requires ${reqs}.`, 'action');
      return;
    }

    if (card.type === 'ship') {
      const duplicate = this.harborDisplay.some(c => c.type === 'ship' && (c as ShipCard).color === card.color);
      if (duplicate) {
        this.log(`${this.activePlayer.name} drew a duplicate ${SHIP_NAME[card.color]} — BUST! Harbor cleared.`, 'bust');
        this.discard.push(...this.harborDisplay);
        this.harborDisplay = [];
        this.lastDrawnShipId = null;
        this.busted = true;
        for (const p of this.players) {
          const jesters = p.professions.filter(pr => pr.profession === 'jester').length;
          if (jesters > 0) {
            p.coins += jesters;
            this.log(`${p.name}'s Jester(s) trigger on bust — gains ${jesters} coin(s).`, 'action');
          }
        }
        this.startTurnTimer(this.activePlayer.id, 2500, { type: 'PASS_TURN' });
        return;
      }
      this.lastDrawnShipId = card.id;
      this.log(`${this.activePlayer.name} drew ${SHIP_NAME[card.color]} (⚔${card.cutlasses}, 🪙${card.coins}).`, 'action');
    }

    if (card.type === 'profession') {
      this.lastDrawnShipId = null;
      this.log(`${this.activePlayer.name} drew ${card.name} (cost ${card.cost}, ★${card.influence}).`, 'action');
    }

    this.harborDisplay.push(card);
  }

  private actionStop(socketId: string): void {
    this.assertPhase('discover');
    this.assertActivePlayer(socketId);
    if (this.busted) throw new Error('Already busted — use PASS_TURN');
    this.log(`${this.activePlayer.name} stops drawing (${this.harborDisplay.length} card(s) in harbor).`, 'info');
    this.beginTradeHirePhase();
  }

  private actionRepel(socketId: string, cardId: string): void {
    this.assertPhase('discover');
    this.assertActivePlayer(socketId);

    const card = this.harborDisplay.find(c => c.id === cardId);
    if (!card || card.type !== 'ship') throw new Error('Card not found or not a ship');
    if (card.cannotBeRepelled) throw new Error('This ship cannot be repelled');

    const cutlasses = this.computeCutlasses(this.activePlayer);
    if (cutlasses < card.cutlasses) throw new Error('Not enough cutlasses');

    this.harborDisplay = this.harborDisplay.filter(c => c.id !== cardId);
    this.discard.push(card);
    this.lastDrawnShipId = null;
    this.log(`${this.activePlayer.name} repels the ${SHIP_NAME[card.color]} (used ${cutlasses}⚔).`, 'action');
  }

  private actionTrade(socketId: string, cardId: string): void {
    this.assertTakeCardPhase(socketId);

    const card = this.harborDisplay.find(c => c.id === cardId);
    if (!card || card.type !== 'ship') throw new Error('Card not found or not a ship');

    const player = this.getPlayer(socketId);

    if (this.phase === 'other_players_turn') {
      if (player.coins < 1) throw new Error('Not enough coins to pay active player');
      player.coins -= 1;
      this.activePlayer.coins += 1;
      this.log(`${player.name} pays ${this.activePlayer.name} 1 coin (harbor fee).`, 'info');
    }

    let gained = card.coins;
    const traderBonus = player.professions.filter(
      p => p.profession === 'trader' && p.traderColor === card.color
    ).length;
    gained += traderBonus;

    player.coins += gained;
    this.harborDisplay = this.harborDisplay.filter(c => c.id !== cardId);
    this.discard.push(card);
    this.cardsTaken++;

    const bonusNote = traderBonus > 0 ? ` (+${traderBonus} Trader bonus)` : '';
    this.log(`${player.name} trades ${SHIP_NAME[card.color]} for ${gained} coin(s)${bonusNote}.`, 'action');

    this.checkPhaseDone(socketId);
  }

  private actionHire(socketId: string, cardId: string): void {
    this.assertTakeCardPhase(socketId);

    const card = this.harborDisplay.find(c => c.id === cardId);
    if (!card || card.type !== 'profession') throw new Error('Card not found or not a profession');

    const player = this.getPlayer(socketId);

    const señoritaCount = player.professions.filter(p => p.profession === 'senorita').length;
    const cost = Math.max(0, card.cost - señoritaCount);

    if (player.coins < cost) throw new Error('Not enough coins');

    if (this.phase === 'other_players_turn') {
      if (player.coins < cost + 1) throw new Error('Not enough coins (including active player fee)');
      player.coins -= 1;
      this.activePlayer.coins += 1;
      this.log(`${player.name} pays ${this.activePlayer.name} 1 coin (harbor fee).`, 'info');
    }

    player.coins -= cost;
    player.professions.push(card);
    this.harborDisplay = this.harborDisplay.filter(c => c.id !== cardId);
    this.cardsTaken++;

    const discountNote = señoritaCount > 0 ? ` (${señoritaCount} Señorita discount)` : '';
    this.log(`${player.name} hires ${card.name} for ${cost} coin(s)${discountNote} (★${card.influence}).`, 'action');

    this.checkPhaseDone(socketId);
  }

  private actionClaimExpedition(socketId: string, expeditionId: string, sacrificeIds: string[]): void {
    this.assertActivePlayer(socketId);

    const expedition = this.expeditionsOnTable.find(e => e.id === expeditionId);
    if (!expedition) throw new Error('Expedition not found');

    const player = this.activePlayer;

    const sacrifices: ProfessionCard[] = [];
    for (const sid of sacrificeIds) {
      const prof = player.professions.find(p => p.id === sid);
      if (!prof) throw new Error(`Profession ${sid} not in your display`);
      sacrifices.push(prof);
    }

    const remaining = {
      priest: expedition.requirements.priest ?? 0,
      settler: expedition.requirements.settler ?? 0,
      captain: expedition.requirements.captain ?? 0,
    };

    // Process specific professions first so Jacks only fill remaining gaps
    const specifics = sacrifices.filter(s => s.profession !== 'jack');
    const jacks = sacrifices.filter(s => s.profession === 'jack');

    for (const s of specifics) {
      if (s.profession === 'priest' && remaining.priest > 0) remaining.priest--;
      else if (s.profession === 'settler' && remaining.settler > 0) remaining.settler--;
      else if (s.profession === 'captain' && remaining.captain > 0) remaining.captain--;
      else throw new Error(`${s.name} does not fulfill any remaining requirement`);
    }

    for (const _ of jacks) {
      const keys = Object.keys(remaining) as Array<keyof typeof remaining>;
      const maxKey = keys.reduce((a, b) => remaining[a] >= remaining[b] ? a : b);
      if (remaining[maxKey] === 0) throw new Error('Jack of all Trades has no remaining requirement to fill');
      remaining[maxKey]--;
    }

    const totalRemaining = remaining.priest + remaining.settler + remaining.captain;
    if (totalRemaining > 0) throw new Error('Requirements not fully met');

    const sacrificeIdSet = new Set(sacrificeIds);
    player.professions = player.professions.filter(p => !sacrificeIdSet.has(p.id));
    this.discard.push(...sacrifices);

    this.expeditionsOnTable = this.expeditionsOnTable.filter(e => e.id !== expeditionId);
    player.expeditions.push(expedition);
    player.coins += expedition.coinReward;

    const sacrificeNames = sacrifices.map(s => s.name).join(', ');
    this.log(`${player.name} claims an Expedition (★${expedition.influence}, +${expedition.coinReward} coins) — sacrificed: ${sacrificeNames}.`, 'action');
  }

  private actionPass(socketId: string): void {
    if (this.phase === 'discover' && this.busted) {
      this.assertActivePlayer(socketId);
      this.log(`${this.activePlayer.name} ends their turn after busting.`, 'info');
      this.beginOtherPlayersTurn();
      return;
    }

    if (this.phase === 'trade_hire') {
      this.assertPlayer(socketId, this.currentTurnPlayerId);
      this.log(`${this.activePlayer.name} finishes Phase 2.`, 'info');
      this.beginOtherPlayersTurn();
      return;
    }

    if (this.phase === 'other_players_turn') {
      this.assertPlayer(socketId, this.currentTurnPlayerId);
      const player = this.getPlayer(socketId);
      this.log(`${player.name} skips their harbor turn.`, 'info');
      this.advanceOtherPlayersTurn();
      return;
    }

    throw new Error('Cannot pass in current phase');
  }

  private actionGambler(socketId: string): void {
    this.assertPhase('discover');
    this.assertActivePlayer(socketId);
    if (this.busted) throw new Error('Already busted');

    const player = this.activePlayer;
    const gamblerCount = player.professions.filter(p => p.profession === 'gambler').length;
    if (gamblerCount === 0) throw new Error('No Gambler in display');
    if (this.gamblerUsedThisTurn) throw new Error('Gambler already used this turn');

    this.gamblerUsedThisTurn = true;
    this.log(`${player.name} uses Gambler — drawing 4 cards at once!`, 'action');

    const drawn: Card[] = [];
    for (let i = 0; i < 4; i++) {
      const c = this.drawFromDeck();
      if (c) drawn.push(c);
    }

    const taxes = drawn.filter(c => c.type === 'tax_increase');
    for (const t of taxes) {
      this.log(`Tax Increase resolved during Gambler draw.`, 'warn');
      this.resolveTaxIncrease(t as any);
      this.discard.push(t);
    }

    const ships = drawn.filter(c => c.type === 'ship') as ShipCard[];
    const others = drawn.filter(c => c.type !== 'tax_increase' && c.type !== 'ship');
    const drawnColors = ships.map(s => s.color);

    const bustFromDupes = drawnColors.length !== new Set(drawnColors).size;
    const bustFromHarbor = !bustFromDupes && ships.some(s =>
      this.harborDisplay.some(c => c.type === 'ship' && (c as ShipCard).color === s.color)
    );

    if (bustFromDupes || bustFromHarbor) {
      this.log(`${player.name}'s Gambler BUSTS! Duplicate ship color found.`, 'bust');
      this.discard.push(...this.harborDisplay, ...ships, ...others);
      this.harborDisplay = [];
      this.busted = true;
      for (const p of this.players) {
        const jesters = p.professions.filter(pr => pr.profession === 'jester').length;
        if (jesters > 0) {
          p.coins += jesters;
          this.log(`${p.name}'s Jester(s) trigger on bust — gains ${jesters} coin(s).`, 'action');
        }
      }
      this.startTurnTimer(player.id, 2500, { type: 'PASS_TURN' });
      return;
    }

    const shipNames = ships.map(s => SHIP_NAME[s.color]).join(', ');
    this.log(`Gambler success! Drew: ${shipNames || 'no ships'}. Gains 1 extra card in Phase 2.`, 'action');

    for (const c of [...ships, ...others]) {
      if (c.type === 'expedition') {
        this.expeditionsOnTable.push(c as ExpeditionCard);
      } else {
        this.harborDisplay.push(c);
      }
    }

    this.beginTradeHirePhase();
    this.cardsCanTake += 1;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private checkPhaseDone(socketId: string): void {
    if (this.cardsTaken >= this.cardsCanTake) {
      if (this.phase === 'trade_hire') {
        this.beginOtherPlayersTurn();
      } else if (this.phase === 'other_players_turn') {
        this.advanceOtherPlayersTurn();
      }
    }
  }

  private resolveTaxIncrease(card: { variant: 'max' | 'min' }): void {
    for (const p of this.players) {
      if (p.coins >= 12) {
        const lost = p.coins - Math.ceil(p.coins / 2);
        p.coins = Math.ceil(p.coins / 2);
        this.log(`${p.name} has 12+ coins — loses ${lost} coins to the Tax.`, 'warn');
      }
    }

    if (card.variant === 'max') {
      const maxCutlasses = Math.max(...this.players.map(p => this.computeCutlasses(p)));
      for (const p of this.players) {
        if (this.computeCutlasses(p) === maxCutlasses) {
          p.coins++;
          this.log(`${p.name} has most cutlasses (${maxCutlasses}⚔) — gains 1 coin.`, 'info');
        }
      }
    } else {
      const minInfluence = Math.min(...this.players.map(p => this.computeInfluence(p)));
      for (const p of this.players) {
        if (this.computeInfluence(p) === minInfluence) {
          p.coins++;
          this.log(`${p.name} has fewest influence (★${minInfluence}) — gains 1 coin.`, 'info');
        }
      }
    }
  }

  private drawFromDeck(): Card | null {
    if (this.deck.length === 0) {
      if (this.discard.length === 0) return null;
      this.deck = shuffle(this.discard.filter(c => c.id !== 'coin'));
      this.discard = [];
      this.log('Deck exhausted — discard pile reshuffled.', 'system');
    }
    return this.deck.pop() ?? null;
  }

  private computeInfluence(p: ServerPlayer): number {
    return (
      p.professions.reduce((s, c) => s + c.influence, 0) +
      p.expeditions.reduce((s, c) => s + c.influence, 0)
    );
  }

  private computeCutlasses(p: ServerPlayer): number {
    return p.professions.reduce((s, c) => {
      if (c.profession === 'sailor') return s + 1;
      if (c.profession === 'pirate') return s + 2;
      if (c.profession === 'cannoneer') return s + 3;
      return s;
    }, 0);
  }

  private get activePlayer(): ServerPlayer {
    return this.players[this.activePlayerIndex];
  }

  private getPlayer(id: string): ServerPlayer {
    const p = this.players.find(p => p.id === id);
    if (!p) throw new Error('Player not found');
    return p;
  }

  private assertPhase(expected: typeof this.phase): void {
    if (this.phase !== expected) throw new Error(`Expected phase ${expected}, got ${this.phase}`);
  }

  private assertActivePlayer(socketId: string): void {
    if (this.activePlayer.id !== socketId) throw new Error('Not your turn');
  }

  private assertPlayer(socketId: string, expectedId: string): void {
    if (socketId !== expectedId) throw new Error('Not your turn');
  }

  private assertTakeCardPhase(socketId: string): void {
    if (this.phase !== 'trade_hire' && this.phase !== 'other_players_turn') {
      throw new Error('Not in a take-card phase');
    }
    if (this.currentTurnPlayerId !== socketId) throw new Error('Not your turn');
    if (this.cardsTaken >= this.cardsCanTake) throw new Error('Already taken maximum cards');
  }

  // ── State Serialization ────────────────────────────────────────────────────

  toClientState(): ClientGameState {
    const allGuessed = Object.keys(this.numberGuesses).length === this.players.length;
    const numberGuess: ClientGameState['numberGuess'] = this.phase === 'number_guess' ? {
      guessedPlayerIds: Object.keys(this.numberGuesses),
      targetNumber: allGuessed ? this.numberGuessTarget : undefined,
      results: allGuessed
        ? this.players.map(p => ({ id: p.id, name: p.name, guess: this.numberGuesses[p.id] }))
        : undefined,
    } : undefined;

    return {
      gameId: this.id,
      players: this.players.map(p => this.serializePlayer(p)),
      activePlayerId: this.activePlayer?.id ?? '',
      currentTurnPlayerId: this.currentTurnPlayerId,
      phase: this.phase,
      harborDisplay: this.harborDisplay,
      expeditionsOnTable: this.expeditionsOnTable,
      deckCount: this.deck.length,
      cardsCanTake: this.cardsCanTake,
      cardsTaken: this.cardsTaken,
      busted: this.busted,
      gameOver: this.gameOver,
      winnerId: this.winnerId,
      log: this.logEntries,
      lastDrawnShipId: this.lastDrawnShipId ?? undefined,
      numberGuess,
    };
  }

  private serializePlayer(p: ServerPlayer): ClientPlayer {
    return {
      id: p.id,
      name: p.name,
      coins: p.coins,
      influence: this.computeInfluence(p),
      cutlasses: this.computeCutlasses(p),
      professions: p.professions,
      expeditions: p.expeditions,
      color: p.color,
    };
  }
}
