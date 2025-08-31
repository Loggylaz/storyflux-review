'use client';
import { useEffect, useRef } from 'react';

type Props = { text: string; role?: 'narrator'|'npc1'|'npc2'; style?: string; };
const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

export default function SmartTTS({ text, role='narrator', style }: Props) {
  const audioRef = useRef<HTMLAudioElement|null>(null);

  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${SERVER}/tts?role=${role}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, style })
        });

        if (res.status === 204) return speakClient(text);
        if (!res.ok) throw new Error('TTS server error');

        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const blob = new Blob([buf], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
      } catch {
        speakClient(text);
      }
    })();
    return () => { cancelled = true; };
  }, [text, role, style]);

  return null;
}

function speakClient(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}
