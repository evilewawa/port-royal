import { useState } from 'react';
import type { GameState, Player } from '../types';
import './NumberGuessPhase.css';

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onGuess: (value: number) => void;
}

export default function NumberGuessPhase({ gameState, localPlayer, onGuess }: Props) {
  const [input, setInput] = useState('');
  const ng = gameState.numberGuess;
  const hasGuessed = ng?.guessedPlayerIds.includes(localPlayer.id) ?? false;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(input, 10);
    if (n >= 1 && n <= 10) onGuess(n);
  }

  return (
    <div className="number-guess">
      <div className="number-guess__card">
        <h2>Who Goes First?</h2>
        <p className="number-guess__subtitle">
          Guess a number 1–10. Closest to the secret number goes first!
        </p>

        <div className="number-guess__players">
          {gameState.players.map(p => {
            const guessed = ng?.guessedPlayerIds.includes(p.id) ?? false;
            const result = ng?.results?.find(r => r.id === p.id);
            return (
              <div key={p.id} className={`number-guess__player ${guessed ? 'number-guess__player--guessed' : ''}`}>
                <span>{p.name}</span>
                {result ? (
                  <span className="number-guess__value">{result.guess}</span>
                ) : guessed ? (
                  <span className="number-guess__ready">✓ Ready</span>
                ) : (
                  <span className="number-guess__waiting">Thinking…</span>
                )}
              </div>
            );
          })}
        </div>

        {ng?.targetNumber !== undefined && (
          <div className="number-guess__reveal">
            Secret number was <strong>{ng.targetNumber}</strong>!
            <br />
            <span className="number-guess__first">{ng.results?.[0]?.name} goes first.</span>
          </div>
        )}

        {!hasGuessed && ng?.targetNumber === undefined && (
          <form className="number-guess__form" onSubmit={handleSubmit}>
            <input
              type="number"
              min={1}
              max={10}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="1–10"
              className="number-guess__input"
              autoFocus
            />
            <button
              type="submit"
              className="primary"
              disabled={!input || parseInt(input, 10) < 1 || parseInt(input, 10) > 10}
            >
              Submit Guess
            </button>
          </form>
        )}

        {hasGuessed && ng?.targetNumber === undefined && (
          <p className="number-guess__waiting-others">
            Waiting for {gameState.players.filter(p => !ng?.guessedPlayerIds.includes(p.id)).length} more player(s)…
          </p>
        )}
      </div>
    </div>
  );
}
