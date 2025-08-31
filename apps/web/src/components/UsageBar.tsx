'use client';
import { useEffect, useState } from 'react';

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';
const TTS_FREE_MS = Number(process.env.NEXT_PUBLIC_TTS_FREE_MS ?? 45*60*1000); // 45 min

export default function UsageBar({ roomId }: { roomId: string }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const r = await fetch(`${SERVER}/usage/${roomId}`);
      const j = await r.json();
      setMs(j?.ttsMsOut ?? 0);
    })();
  }, [roomId]);

  const pct = Math.min(100, Math.round((ms / TTS_FREE_MS) * 100));
  return (
    <div style={{background:'#eee', borderRadius:8, padding:4}}>
      <div style={{fontSize:12, marginBottom:4}}>Voix (gratuit) : {Math.round(ms/60000)} / {Math.round(TTS_FREE_MS/60000)} min</div>
      <div style={{height:10, background:'#ddd', borderRadius:6}}>
        <div style={{height:10, width:`${pct}%`, background: pct>90?'#c33':'#3c9', borderRadius:6}}/>
      </div>
    </div>
  );
}
