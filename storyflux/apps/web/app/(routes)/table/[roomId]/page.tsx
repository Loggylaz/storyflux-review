'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRoom } from '@/src/store/useRoom';
import TTS from '@/src/components/TTS';
import ASR from '@/src/components/ASR';

export default function TablePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [action, setAction] = useState('');
  const { connect, missing, sendAction, summary, setSummary } = useRoom();
  const userId = (typeof window !== 'undefined' && sessionStorage.getItem('userId')) || 'anon';
  const displayName = (typeof window !== 'undefined' && sessionStorage.getItem('displayName')) || 'Joueur';

  useEffect(() => {
    connect(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000', roomId, userId, displayName);
  }, [connect, roomId, userId, displayName]);

  const waiting =
    missing.length > 0
      ? `Que faites-vous ${missing.join(', ')} ?`
      : (summary ? `Résolution: ${summary}` : 'Actions en cours...');

  return (
    <div className="card">
      <h2>Table {roomId}</h2>
      <p><strong>{waiting}</strong></p>
      <TTS text={waiting} />
      <div className="row">
        <input value={action} onChange={e=>setAction(e.target.value)} placeholder="Décrivez votre action..." />
        <button onClick={() => { sendAction(action || 'passe son tour'); setAction(''); }}>Envoyer</button>
        <ASR onText={(t)=>setAction(t)} />
        <button onClick={()=>setSummary(undefined)}>Effacer résumé</button>
      </div>
    </div>
  );
}
