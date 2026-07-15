/* eslint-disable @typescript-eslint/no-explicit-any */
import { ART, kwOf } from '../engine/data';

const KW_COLORS: Record<string, string> = {
  ambush: '#7a4800', venom: '#7a1010', range: '#1a5a80', pack: '#1e7a40', swarm: '#7a5a10', tough: '#5a4a38',
};

export function CardArt({ card, size, battleType }: { card: any; size: number; battleType: 'eat' | 'fk' }) {
  const inner = ART[card.id];
  if (inner) {
    return <div className="card-art" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: inner }} />;
  }
  const k = kwOf(card)[0];
  const col = (k && KW_COLORS[k]) || (battleType === 'eat' ? '#c4561e' : '#7b4fa0');
  return (
    <div
      className="card-art"
      style={{ width: size, height: size, background: col, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.5) }}
    >
      {card.art}
    </div>
  );
}

export function KwTags({ card }: { card: any }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {kwOf(card).map((k: string) => (
        <span key={k} style={{ background: KW_COLORS[k] || '#555' }} className="text-white rounded px-1 text-[8px] font-extrabold uppercase tracking-wide">
          {k}
        </span>
      ))}
    </span>
  );
}
