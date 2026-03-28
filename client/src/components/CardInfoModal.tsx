import './CardInfoModal.css';

interface Props {
  onClose: () => void;
}

const SHIPS = [
  { name: 'Yellow Pinnace', color: 'yellow', coins: '1–4', cutlasses: '1–4', note: 'Smallest and fastest.' },
  { name: 'Blue Flute',     color: 'blue',   coins: '1–5', cutlasses: '1–5', note: 'Mid-range trader.' },
  { name: 'Green Barque',   color: 'green',  coins: '1–5', cutlasses: '1–5', note: 'Mid-range trader.' },
  { name: 'Red Frigate',    color: 'red',    coins: '1–6', cutlasses: '1–6', note: 'Heavy warship.' },
  { name: 'Black Galleon',  color: 'black',  coins: '2–7', cutlasses: '2–7', note: 'Largest and most valuable.' },
];

const PROFESSIONS = [
  { name: 'Sailor',           cost: 2,  influence: 1, ability: 'Provides 1 ⚔ for repelling ships. Cutlasses stack — never spent.' },
  { name: 'Pirate',           cost: 4,  influence: 2, ability: 'Provides 2 ⚔ for repelling ships.' },
  { name: 'Trader (per color)',cost: 3, influence: 1, ability: 'Gain 1 extra coin when trading a ship of the matching color.' },
  { name: 'Señorita',         cost: 3,  influence: 1, ability: 'Reduces the hire cost of any profession by 1 coin (min 0). Stacks.' },
  { name: 'Admiral',          cost: 6,  influence: 2, ability: 'At the start of your Phase 2, if 5+ cards are in the harbor, gain 2 coins per Admiral. (Newly hired Admirals do not trigger immediately.)' },
  { name: 'Jester',           cost: 3,  influence: 1, ability: 'If the harbor is empty at the start of Phase 2, you gain 1 coin per Jester. If Phase 1 ends in a bust, ALL players gain 1 coin per Jester they own.' },
  { name: 'Governor',         cost: 6,  influence: 2, ability: 'May take 1 extra card per Governor during Phase 2 (active and other-player turns).' },
  { name: 'Priest',           cost: 3,  influence: 1, ability: 'Must be discarded to fulfill a Priest requirement on an Expedition.' },
  { name: 'Settler',          cost: 3,  influence: 1, ability: 'Must be discarded to fulfill a Settler requirement on an Expedition.' },
  { name: 'Captain',          cost: 5,  influence: 2, ability: 'Must be discarded to fulfill a Captain requirement on an Expedition.' },
  { name: 'Jack of all Trades',cost: 5, influence: 2, ability: 'Wild card — substitutes for any single Priest, Settler, or Captain when completing an Expedition.' },
  { name: 'Gambler (Promo)',  cost: 4,  influence: 2, ability: 'Once per Discover phase: draw 4 cards simultaneously (cannot repel ships, but Tax Increases still resolve). If 2+ ships share a color → bust. Otherwise, end Phase 1 and gain 1 extra card in Phase 2. Multiple Gamblers can chain.' },
];

const OTHER = [
  { name: 'Expedition',    icon: '🗺', description: 'Placed apart from the harbor when drawn. Only the active player may claim them (even after a bust). Discard the required Professions from your display to claim. Grants influence + coins.' },
  { name: 'Tax Increase',  icon: '⚖', description: 'Resolved immediately when drawn. Players with 12+ coins lose half (rounded down). Then either the player with the most ⚔ (max variant) or fewest ★ (min variant) gains 1 coin. Ties: all tied players gain 1 coin.' },
];

export default function CardInfoModal({ onClose }: Props) {
  return (
    <div className="card-info-overlay" onClick={onClose}>
      <div className="card-info-modal" onClick={e => e.stopPropagation()}>
        <div className="card-info-modal__header">
          <h2>Card Reference</h2>
          <button className="card-info-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="card-info-modal__body">

          <section>
            <h3>Ships</h3>
            <p className="card-info-modal__note">
              During Discover, duplicate ship colors cause a bust. Trade a ship to gain its coin value. You can repel a newly drawn ship if your total ⚔ ≥ the ship's ⚔ value.
            </p>
            <table className="card-info-table">
              <thead>
                <tr><th>Ship</th><th>Coins</th><th>Cutlasses</th><th>Note</th></tr>
              </thead>
              <tbody>
                {SHIPS.map(s => (
                  <tr key={s.name}>
                    <td><span className={`card-info-dot card-info-dot--${s.color}`} />{s.name}</td>
                    <td>🪙 {s.coins}</td>
                    <td>⚔ {s.cutlasses}</td>
                    <td>{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3>Professions</h3>
            <p className="card-info-modal__note">
              Hired from the harbor by paying their coin cost. Abilities are permanent and stack. Other players pay the active player 1 extra coin to hire.
            </p>
            <table className="card-info-table">
              <thead>
                <tr><th>Name</th><th>Cost</th><th>★</th><th>Ability</th></tr>
              </thead>
              <tbody>
                {PROFESSIONS.map(p => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>🪙 {p.cost}</td>
                    <td>{p.influence}</td>
                    <td>{p.ability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3>Other Cards</h3>
            <div className="card-info-other">
              {OTHER.map(o => (
                <div key={o.name} className="card-info-other__item">
                  <div className="card-info-other__name">{o.icon} {o.name}</div>
                  <div className="card-info-other__desc">{o.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3>Phase 2 Card Allowance</h3>
            <table className="card-info-table">
              <thead>
                <tr><th>Different ship colors in harbor</th><th>Cards active player may take</th></tr>
              </thead>
              <tbody>
                <tr><td>0 – 3</td><td>1</td></tr>
                <tr><td>4</td><td>2</td></tr>
                <tr><td>5</td><td>3</td></tr>
              </tbody>
            </table>
          </section>

        </div>
      </div>
    </div>
  );
}
