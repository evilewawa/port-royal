import { useState } from 'react';
import type { ExpeditionCard, ProfessionCard } from '../types';
import './ExpeditionClaimModal.css';

interface Props {
  expedition: ExpeditionCard;
  eligibleProfessions: ProfessionCard[];
  onConfirm: (sacrificeIds: string[]) => void;
  onCancel: () => void;
}

type Remaining = { priest: number; settler: number; captain: number };

function computeRemaining(reqs: ExpeditionCard['requirements'], selected: ProfessionCard[]): Remaining {
  const remaining: Remaining = {
    priest: reqs.priest ?? 0,
    settler: reqs.settler ?? 0,
    captain: reqs.captain ?? 0,
  };
  // Process specific professions first so Jacks only fill remaining gaps
  const specifics = selected.filter(s => s.profession !== 'jack');
  const jacks = selected.filter(s => s.profession === 'jack');
  for (const s of specifics) {
    if (s.profession === 'priest' && remaining.priest > 0) remaining.priest--;
    else if (s.profession === 'settler' && remaining.settler > 0) remaining.settler--;
    else if (s.profession === 'captain' && remaining.captain > 0) remaining.captain--;
  }
  for (const _ of jacks) {
    const keys = Object.keys(remaining) as Array<keyof Remaining>;
    const maxKey = keys.reduce((a, b) => remaining[a] >= remaining[b] ? a : b);
    if (remaining[maxKey] > 0) remaining[maxKey]--;
  }
  return remaining;
}

function isFulfilled(remaining: Remaining): boolean {
  return remaining.priest === 0 && remaining.settler === 0 && remaining.captain === 0;
}

const REQ_LABEL: Record<string, string> = {
  priest: 'Priest',
  settler: 'Settler',
  captain: 'Captain',
};

export default function ExpeditionClaimModal({ expedition, eligibleProfessions, onConfirm, onCancel }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selected = eligibleProfessions.filter(p => selectedIds.includes(p.id));
  const remaining = computeRemaining(expedition.requirements, selected);
  const fulfilled = isFulfilled(remaining);

  function toggle(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const reqEntries = Object.entries(expedition.requirements).filter(([, v]) => v && v > 0);

  return (
    <div className="exp-modal-overlay" onClick={onCancel}>
      <div className="exp-modal" onClick={e => e.stopPropagation()}>
        <div className="exp-modal__header">
          <h3>Claim Expedition</h3>
          <button className="exp-modal__close" onClick={onCancel}>✕</button>
        </div>

        <div className="exp-modal__reward">
          <span>★ {expedition.influence} influence</span>
          <span>🪙 +{expedition.coinReward} coins</span>
        </div>

        <div className="exp-modal__reqs">
          <div className="exp-modal__label">Requirements</div>
          <div className="exp-modal__req-list">
            {reqEntries.map(([key, count]) => {
              const rem = remaining[key as keyof Remaining];
              const met = rem === 0;
              return (
                <div key={key} className={`exp-modal__req ${met ? 'exp-modal__req--met' : ''}`}>
                  {met ? '✓' : `${rem} needed`} {REQ_LABEL[key]} ×{count}
                </div>
              );
            })}
          </div>
        </div>

        <div className="exp-modal__professions">
          <div className="exp-modal__label">Select professions to sacrifice</div>
          {eligibleProfessions.length === 0 ? (
            <div className="exp-modal__none">No eligible professions in your display.</div>
          ) : (
            <div className="exp-modal__prof-list">
              {eligibleProfessions.map(p => (
                <button
                  key={p.id}
                  className={`exp-modal__prof-btn ${selectedIds.includes(p.id) ? 'exp-modal__prof-btn--selected' : ''}`}
                  onClick={() => toggle(p.id)}
                >
                  <span className="exp-modal__prof-name">{p.name}</span>
                  <span className="exp-modal__prof-note">
                    {p.profession === 'jack' ? 'wildcard' : p.profession}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="exp-modal__actions">
          <button onClick={onCancel}>Cancel</button>
          <button
            className="primary"
            disabled={!fulfilled}
            onClick={() => onConfirm(selectedIds)}
          >
            {fulfilled ? 'Claim Expedition' : 'Requirements not met'}
          </button>
        </div>
      </div>
    </div>
  );
}
