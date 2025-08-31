'use client';
import { useEffect, useRef } from 'react';

type VoiceTraits = {
  gender?: 'male'|'female'|'neutral';
  species?: string;
  size?: 'small'|'medium'|'large';
  accent?: string;
  mood?: string;
  age?: 'child'|'young'|'adult'|'elder';
};

type Props = {
  text: string;
  role?: 'narrator'|'npc1'|'npc2';
  style?: string;
  roomId?: string;
  traits?: VoiceTraits;
  preset?: string;
};

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

export default function SmartTTS({ text, role='narrator', style, roomId, traits, preset }: Props) {
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const acRef = useRef<AudioContext|null>(null);

  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    (async () => {
      try {
        const plan = compilePlan(text);
        if (!plan.length) return;

        for (const step of plan) {
          if (cancelled) break;

          if (step.kind === 'pause') {
            await wait(step.ms);
            continue;
          }
          if (step.kind === 'breath') {
            await playBreath(acRef, 240, step.intensity);
            continue;
          }

          const q = new URLSearchParams({ role });
          if (roomId) q.set('roomId', roomId);

          // renforce le “grain” demandé côté serveur
          const extraStyle = step.gravel ? ' | Timbre: rocailleux' : '';
          const body: any = { text: step.text, style: (style || '') + extraStyle };
          if (traits) body.traits = traits;
          if (preset) body.preset = preset;

          const res = await fetch(`${SERVER}/tts?${q.toString()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (res.status === 204) {
            // Fallback Web Speech
            speakClient(step.text);
            await wait(Math.max(400, Math.min(1200, step.text.length * 40)));
            continue;
          }
          if (!res.ok) throw new Error('TTS server error');

          const buf = await res.arrayBuffer();
          if (cancelled) break;
          const blob = new Blob([buf], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          if (!audioRef.current) audioRef.current = new Audio();
          const a = audioRef.current;
          a.src = url;

          // Pitch “pauvre” mais efficace : playbackRate + preservesPitch=false
          try {
            // @ts-ignore
            if (typeof a.preservesPitch !== 'undefined') (a as any).preservesPitch = false;
            // @ts-ignore
            if (typeof a.mozPreservesPitch !== 'undefined') (a as any).mozPreservesPitch = false;
            // @ts-ignore
            if (typeof a.webkitPreservesPitch !== 'undefined') (a as any).webkitPreservesPitch = false;
          } catch {}

          // low:on -> plus grave (~ -2 demi-tons ≈ 0.89)
          a.playbackRate = step.low ? 0.89 : 1.0;

          await playAudio(a);
        }
      } catch {
        speakClient(text);
      }
    })();
    return () => { cancelled = true; };
  }, [text, role, style, roomId, traits, preset]);

  return null;
}

/** Marqueurs :
 * [breath]           -> respiration courte par défaut
 * [breath:int]       -> 1..5 (intensité)
 * [pause:NNN]        -> pause NNN ms
 * [gravel:on/off]    -> voix rocailleuse (hint serveur)
 * [low:on/off]       -> plus grave côté client (playbackRate)
 */
function compilePlan(input: string): Array<
  | { kind:'say'; text:string; gravel:boolean; low:boolean }
  | { kind:'pause'; ms:number }
  | { kind:'breath'; intensity:number }
> {
  const re = /\[(breath)(?::([1-5]))?\]|\[(pause):(\d{1,4})\]|\[(gravel):(on|off)\]|\[(low):(on|off)\]/gi;
  const out: Array<any> = [];
  let last = 0, m: RegExpExecArray|null;
  let gravel = false;
  let low = false;

  while ((m = re.exec(input)) !== null) {
    if (m.index > last) {
      const txt = input.slice(last, m.index).replace(/\s+/g,' ').trim();
      if (txt) out.push({ kind:'say', text: txt, gravel, low });
    }
    if (m[1]) { // breath
      const intensity = m[2] ? Math.max(1, Math.min(5, parseInt(m[2],10))) : 2;
      out.push({ kind:'breath', intensity });
    } else if (m[3]) { // pause
      out.push({ kind:'pause', ms: parseInt(m[4],10) });
    } else if (m[5]) { // gravel
      gravel = (m[6].toLowerCase()==='on');
    } else if (m[7]) { // low
      low = (m[8].toLowerCase()==='on');
    }
    last = re.lastIndex;
  }
  if (last < input.length) {
    const tail = input.slice(last).replace(/\s+/g,' ').trim();
    if (tail) out.push({ kind:'say', text: tail, gravel, low });
  }
  return out;
}

function wait(ms:number) { return new Promise(r=>setTimeout(r, ms)); }

function playAudio(a: HTMLAudioElement) {
  return new Promise<void>((resolve) => {
    const cleanup = () => { a.onended = null; a.onerror = null; resolve(); };
    a.onended = cleanup;
    a.onerror = cleanup;
    a.play().catch(()=>cleanup());
  });
}

function speakClient(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/\[(?:.*?)\]/g,''));
    u.lang = 'fr-FR';
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

/** Respiration synthétique (bruit filtré + enveloppe) */
async function playBreath(acRef: React.MutableRefObject<AudioContext|null>, ms=220, intensity=2) {
  try {
    let ac = acRef.current;
    if (!ac) {
      ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      acRef.current = ac;
      // besoin d'une action utilisateur pour démarrer sur certains navigateurs
      if (ac.state === 'suspended') await ac.resume().catch(()=>{});
    }

    const dur = Math.max(0.15, Math.min(0.6, ms/1000));
    const gainNode = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200; // zone “souffle”
    filter.Q.value = 0.7 + intensity*0.3;

    const noiseBuffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i] = (Math.random()*2 - 1) * (0.15 + intensity*0.07);

    const src = ac.createBufferSource();
    src.buffer = noiseBuffer;

    src.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ac.destination);

    const now = ac.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.35 + intensity*0.08, now + dur*0.3);
    gainNode.gain.linearRampToValueAtTime(0.0, now + dur);

    src.start(now);
    await new Promise<void>(resolve => setTimeout(resolve, ms));
    src.stop();
  } catch {
    // ignore si Web Audio pas dispo
  }
}
