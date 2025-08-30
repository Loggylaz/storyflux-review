'use client';
import { useState } from 'react';
import { trpc } from '@/src/lib/trpc';

export default function SheetPage() {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('Aventurier');
  const [race, setRace] = useState('Humain');
  const [klass, setKlass] = useState('Guerrier');
  const [ca, setCa] = useState(12);
  const [js, setJs] = useState(10);
  const [hp, setHp] = useState(10);
  const userId = (typeof window !== 'undefined' && sessionStorage.getItem('userId')) || 'anon';

  async function create() {
    const r = await trpc.character.create.mutate({
      roomId, userId, name, race, class: klass, ca, js, hp,
      stats: { str:10, dex:10, con:10, int:10, wis:10, cha:10 }
    });
    alert('Fiche créée: ' + r.id);
  }

  return (
    <div className="card">
      <h2>Fiche perso (FR)</h2>
      <div className="row"><input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room ID" /></div>
      <div className="row"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom" /></div>
      <div className="row"><input value={race} onChange={e=>setRace(e.target.value)} placeholder="Race" /></div>
      <div className="row"><input value={klass} onChange={e=>setKlass(e.target.value)} placeholder="Classe" /></div>
      <div className="row"><input type="number" value={ca} onChange={e=>setCa(parseInt(e.target.value))} placeholder="CA" /></div>
      <div className="row"><input type="number" value={js} onChange={e=>setJs(parseInt(e.target.value))} placeholder="JS" /></div>
      <div className="row"><input type="number" value={hp} onChange={e=>setHp(parseInt(e.target.value))} placeholder="PV" /></div>
      <button onClick={create}>Créer</button>
    </div>
  );
}
