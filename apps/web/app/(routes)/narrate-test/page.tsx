'use client';
import { useState } from 'react';
import SmartTTS from '@/src/components/SmartTTS';

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

type Seg = { kind:'NARRATE'|'NPC'; text:string; role:'narrator'|'npc1'|'npc2'; style?:string };

export default function NarrateTestPage() {
  const [sceneSummary, setSceneSummary] = useState('Taverne animée sous la pluie.');
  const [actions, setActions] = useState([{name:'Lina', action:'observe le tavernier'},{name:'Gor', action:'demande de la bière'}]);
  const [segments, setSegments] = useState<Seg[]>([]);
  const [playing, setPlaying] = useState<Seg|null>(null);

  async function go() {
    const r = await fetch(`${SERVER}/mj/narrate`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ locale:'fr', sceneSummary, actions })
    });
    const j = await r.json();
    setSegments(j.segments || []);
  }

  return (
    <div className="card">
      <h2>Test narration MJ</h2>
      <textarea value={sceneSummary} onChange={e=>setSceneSummary(e.target.value)} rows={3} style={{width:'100%'}}/>
      <button onClick={go}>Générer</button>

      <ul>
        {segments.map((s, i) => (
          <li key={i} style={{margin:'8px 0'}}>
            <strong>{s.kind}</strong> [{s.role}{s.style?` | ${s.style}`:''}] — {s.text}
            {playing?.text === s.text ? ' 🔊' : (
              <>
                <button onClick={()=>setPlaying(s)}>▶︎ Lire</button>
                {playing?.text === s.text && <SmartTTS text={s.text} role={s.role as any} style={s.style} />}
              </>
            )}
            {playing?.text === s.text && <SmartTTS text={s.text} role={s.role as any} style={s.style} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
