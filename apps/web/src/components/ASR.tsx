'use client';
import { useEffect, useRef, useState } from 'react';

export default function ASR({ onText }: { onText: (t: string) => void }) {
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'fr-FR';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        onText(t);
      };
      recognitionRef.current = rec;
      setSupported(true);
    }
  }, [onText]);

  if (!supported) return <small>(ASR non supporté, utilisez le texte)</small>;

  return (
    <button onClick={() => recognitionRef.current?.start()}>🎙️ Push-to-Talk</button>
  );
}
