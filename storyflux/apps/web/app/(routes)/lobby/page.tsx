'use client';
import { useState } from 'react';
import { trpc } from '@/src/lib/trpc';
import { useRouter } from 'next/navigation';

export default function LobbyPage() {
  const [roomName, setRoomName] = useState('Salon de test');
  const [displayName, setDisplayName] = useState('MJ');
  const [roomIdJoin, setRoomIdJoin] = useState('');
  const router = useRouter();

  async function createRoom() {
    const r = await trpc.room.create.mutate({ name: roomName, createdByName: displayName, lang: 'fr' });
    sessionStorage.setItem('userId', r.userId);
    sessionStorage.setItem('displayName', displayName);
    router.push(`/table/${r.roomId}`);
  }
  async function joinRoom() {
    const r = await trpc.room.join.mutate({ roomId: roomIdJoin, displayName });
    sessionStorage.setItem('userId', r.userId);
    sessionStorage.setItem('displayName', displayName);
    router.push(`/table/${r.roomId}`);
  }

  return (
    <div className="card">
      <h2>Lobby</h2>
      <div className="row">
        <input value={roomName} onChange={e=>setRoomName(e.target.value)} placeholder="Nom du salon" />
        <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Votre nom" />
        <button onClick={createRoom}>Créer un salon</button>
      </div>
      <div className="row" style={{marginTop:8}}>
        <input value={roomIdJoin} onChange={e=>setRoomIdJoin(e.target.value)} placeholder="Room ID" />
        <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Votre nom" />
        <button onClick={joinRoom}>Rejoindre</button>
      </div>
    </div>
  );
}
