'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import SmartTTS from '@/src/components/SmartTTS';

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

type Actor = {
  name?: string;
  gender?: 'male'|'female'|'neutral';
  species?: string;
  size?: 'small'|'medium'|'large';
  accent?: string;
  mood?: string;
  age?: 'child'|'young'|'adult'|'elder';
};
type Seg = { kind:'NARRATE'|'NPC'; text:string; role:'narrator'|'npc1'|'npc2'; style?:string; actor?: Actor };

export default function NarrateTestPage() {
  const [roomId, setRoomId] = useState('');
  const [sceneSummary, setSceneSummary] = useState('Taverne animée sous la pluie.');
  const [actionsRaw, setActionsRaw] = useState('Lina: observe le tavernier\nGor: demande une bière');
  const [segments, setSegments] = useState<Seg[]>([]);
  const [auto, setAuto] = useState(true);
  const [idx, setIdx] = useState<number>(-1);
  const playingSeg = useMemo(() => (idx >= 0 ? segments[idx] : null), [idx, segments]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function parseActions(): {name:string; action:string}[] {
    return actionsRaw
      .split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => {
        const [name, ...rest] = l.split(':');
        return { name: (name || 'Joueur').trim(), action: (rest.join(':') || '').trim() || 'agit' };
      });
  }

  async function generate() {
    setSegments([]); setIdx(-1);
    const r = await fetch(`${SERVER}/mj/narrate`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ locale:'fr', sceneSummary, actions: parseActions() })
    });
    const j = await r.json();
    setSegments(Array.isArray(j.segments) ? j.segments : []);
  }

  function estimateSeconds(text: string) {
    return Math.max(2, Math.ceil(text.length / 15));
  }

  useEffect(() => {
    if (!auto || segments.length === 0) return;
    if (idx === -1) return;
    const seg = segments[idx]; if (!seg) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIdx(prev => (prev + 1 < segments.length ? prev + 1 : -1));
    }, estimateSeconds(seg.text) * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [auto, idx, segments]);

  function playAll() { if (segments.length) setIdx(0); }

  return (
    <div className="card" style={{maxWidth: 900, margin: '0 auto'}}>
      <h2>Test narration MJ</h2>
      <div className="row" style={{gap: 8}}>
        <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room ID (optionnel)" style={{flex:1}} />
        <label style={{display:'flex', alignItems:'center', gap:6}}>
          <input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)} /> Autoplay
        </label>
      </div>

      <div style={{marginTop: 8}}>
        <label>Résumé de scène</label>
        <textarea value={sceneSummary} onChange={e=>setSceneSummary(e.target.value)} rows={3} style={{width:'100%'}}/>
      </div>

      <div style={{marginTop: 8}}>
        <label>Actions (une par ligne: Nom: action)</label>
        <textarea value={actionsRaw} onChange={e=>setActionsRaw(e.target.value)} rows={4} style={{width:'100%'}}/>
      </div>

      <div className="row" style={{gap: 8, marginTop: 8}}>
        <button onClick={generate}>Générer</button>
        <button onClick={() => { generate().then(()=> setTimeout(playAll, 200)); }}>Générer & Lire tout</button>
      </div>

      <ul style={{marginTop: 16}}>
        {segments.map((s, i) => {
          const isPlaying = i === idx;
          return (
            <li key={i} className="card" style={{borderColor: isPlaying ? '#3c9' : '#ddd'}}>
              <div>
                <strong>{s.kind}</strong> [{s.role}{s.style ? ` | ${s.style}` : ''}]
                {s.actor && (
                  <span style={{marginLeft:8, opacity:0.8}}>
                    — {s.actor.name ?? 'PNJ'} ({s.actor.gender ?? 'neutral'} {s.actor.species ?? ''} {s.actor.accent ? `· ${s.actor.accent}` : ''})
                  </span>
                )}
              </div>
              <div style={{whiteSpace:'pre-wrap'}}>{s.text}</div>
              <div style={{marginTop: 6, display:'flex', gap: 8}}>
                <button onClick={() => setIdx(i)} disabled={isPlaying}>▶ Lire</button>
                {isPlaying && <span>🔊 En lecture…</span>}
              </div>

              {/* Ici: on passe traits=actor pour piloter la voix automatiquement */}
              {isPlaying && (
                <SmartTTS
                  text={s.text}
                  role={s.role as any}
                  style={s.style}
                  roomId={roomId || undefined}
                  traits={s.actor}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
