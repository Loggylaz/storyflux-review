'use client';
import { useState } from 'react';
import { trpc } from '@/src/lib/trpc';

type Entry = {
  id: string;
  kind: string;
  content: string;
  createdAt: string;
};

export default function JournalPage() {
  const [roomId, setRoomId] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!roomId) return alert('Room ID requis');
    setLoading(true);
    try {
      const data = await trpc.journal.list.query({ roomId, limit: 100 });
      setEntries(data as any);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    if (!roomId || !newContent.trim()) return;
    await trpc.journal.add.mutate({ roomId, kind: 'text', content: newContent.trim() });
    setNewContent('');
    await refresh();
  }

  return (
    <div className="card">
      <h2>Journal (persistant)</h2>
      <div className="row">
        <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room ID" />
        <button onClick={refresh} disabled={loading}>{loading ? 'Chargement...' : 'Rafraîchir'}</button>
      </div>
      <div className="row" style={{marginTop:8}}>
        <input
          value={newContent}
          onChange={e=>setNewContent(e.target.value)}
          placeholder="Ajouter une entrée (texte court)"
          style={{flex:1}}
        />
        <button onClick={add}>Ajouter</button>
      </div>
      <ul>
        {entries.map(e => (
          <li key={e.id} className="card">
            <div><strong>{e.kind}</strong> — {new Date(e.createdAt).toLocaleString()}</div>
            <div>{e.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
