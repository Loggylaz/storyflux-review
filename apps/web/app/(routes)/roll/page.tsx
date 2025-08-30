'use client';
import { useState } from 'react';
import { trpc } from '@/src/lib/trpc';

export default function RollPage() {
  const [roomId, setRoomId] = useState('');
  const [modifier, setModifier] = useState(0);
  async function roll() {
    if (!roomId) return alert('Room ID requis');
    const r = await trpc.dice.rollD20.mutate({ roomId, modifier });
    alert(`d20 = ${r.result} (mod ${r.modifier})\nSignature: ${r.signature.slice(0,12)}...`);
  }
  return (
    <div className="card">
      <h2>Démonstration dés (serveur)</h2>
      <div className="row">
        <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room ID" />
        <input type="number" value={modifier} onChange={e=>setModifier(parseInt(e.target.value))} placeholder="mod." />
        <button onClick={roll}>Lancer d20</button>
      </div>
    </div>
  );
}
