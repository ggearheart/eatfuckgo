/* eslint-disable @typescript-eslint/no-explicit-any */
import { ART, facOfCard } from '../engine/data';

export function CardArt({ card, size, battleType }: { card: any; size: number; battleType?: 'eat' | 'fk' }) {
  const inner = ART[card.id];
  if (inner) {
    return <div className="card-art" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: inner }} />;
  }
  const col = facOfCard(card) === 'eat' ? '#c4561e' : '#7b4fa0';
  void battleType;
  return (
    <div
      className="card-art"
      style={{ width: size, height: size, background: col, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.5) }}
    >
      {card.art}
    </div>
  );
}
