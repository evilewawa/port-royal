import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';
import './GameLog.css';

interface Props {
  entries: LogEntry[];
  players?: Array<{ id: string; name: string; color: string }>;
}

export default function GameLog({ entries, players }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distFromBottom < 50;
  }

  useEffect(() => {
    if (!isAtBottomRef.current) return;
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  function renderText(text: string) {
    if (!players || players.length === 0) return text;
    // Color player names in log text
    const parts: Array<string | JSX.Element> = [text];
    for (const p of players) {
      const next: Array<string | JSX.Element> = [];
      for (const part of parts) {
        if (typeof part !== 'string') { next.push(part); continue; }
        const segments = part.split(p.name);
        segments.forEach((seg, i) => {
          next.push(seg);
          if (i < segments.length - 1) {
            next.push(<span key={`${p.id}-${i}`} style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>);
          }
        });
      }
      parts.length = 0;
      parts.push(...next);
    }
    return parts;
  }

  return (
    <div className="game-log">
      <div className="game-log__title">Game Log</div>
      <div className="game-log__entries" ref={containerRef} onScroll={handleScroll}>
        {entries.map(e => (
          <div key={e.id} className={`game-log__entry game-log__entry--${e.kind}`}>
            {renderText(e.text)}
          </div>
        ))}
      </div>
    </div>
  );
}
