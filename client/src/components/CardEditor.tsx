import { useState } from 'react';
import type { GameConfig, ProfessionConfig } from '../types';
import { DEFAULT_PROFESSION_CONFIG } from '../types';
import './CardEditor.css';

interface Props {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}

const PROFESSION_ORDER = [
  'sailor', 'pirate', 'trader', 'senorita', 'jester',
  'priest', 'settler', 'jack', 'captain', 'admiral', 'governor', 'gambler',
];

export default function CardEditor({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function updateProf(type: string, field: keyof ProfessionConfig, raw: string) {
    const value = field === 'name' ? raw : parseInt(raw, 10);
    if (field !== 'name' && isNaN(value as number)) return;
    onChange({
      ...config,
      professions: {
        ...config.professions,
        [type]: { ...config.professions[type], [field]: value },
      },
    });
  }

  function updateGlobal(field: 'startingCoins' | 'winInfluence', raw: string) {
    const value = parseInt(raw, 10);
    if (isNaN(value)) return;
    onChange({ ...config, [field]: value });
  }

  function reset() {
    onChange({
      ...config,
      professions: { ...DEFAULT_PROFESSION_CONFIG },
      startingCoins: 3,
      winInfluence: 12,
    });
  }

  return (
    <div className="card-editor">
      <button className="card-editor__toggle" onClick={() => setOpen(o => !o)}>
        {open ? '▲' : '▼'} Card Settings
      </button>

      {open && (
        <div className="card-editor__body">
          <div className="card-editor__globals">
            <label>
              Starting Coins
              <input
                type="number" min={0} max={20}
                value={config.startingCoins}
                onChange={e => updateGlobal('startingCoins', e.target.value)}
              />
            </label>
            <label>
              Win at ★
              <input
                type="number" min={1} max={30}
                value={config.winInfluence}
                onChange={e => updateGlobal('winInfluence', e.target.value)}
              />
            </label>
            <button onClick={reset}>Reset defaults</button>
          </div>

          <div className="card-editor__table-wrap">
            <table className="card-editor__table">
              <thead>
                <tr>
                  <th>Profession</th>
                  <th title="Hire cost in coins">Cost 🪙</th>
                  <th title="Influence points">Influence ★</th>
                  <th title="Number of copies in the deck">Count #</th>
                </tr>
              </thead>
              <tbody>
                {PROFESSION_ORDER.map(type => {
                  const prof = config.professions[type];
                  if (!prof) return null;
                  const def = DEFAULT_PROFESSION_CONFIG[type];
                  const changed =
                    prof.cost !== def.cost ||
                    prof.influence !== def.influence ||
                    prof.count !== def.count;
                  return (
                    <tr key={type} className={changed ? 'card-editor__row--changed' : ''}>
                      <td className="card-editor__name">
                        {prof.name}
                        {type === 'trader' && <span className="card-editor__note"> (per color)</span>}
                      </td>
                      <td>
                        <input
                          type="number" min={0} max={20}
                          value={prof.cost}
                          onChange={e => updateProf(type, 'cost', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number" min={0} max={20}
                          value={prof.influence}
                          onChange={e => updateProf(type, 'influence', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number" min={0} max={20}
                          value={prof.count}
                          onChange={e => updateProf(type, 'count', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
