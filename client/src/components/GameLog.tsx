import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';
import './GameLog.css';

interface Props {
  entries: LogEntry[];
}

export default function GameLog({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="game-log">
      <div className="game-log__title">Game Log</div>
      <div className="game-log__entries">
        {entries.map(e => (
          <div key={e.id} className={`game-log__entry game-log__entry--${e.kind}`}>
            {e.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
