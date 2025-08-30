'use client';
import { useEffect } from 'react';

export default function TTS({ text }: { text: string }) {
  useEffect(() => {
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'fr-FR';
    utter.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [text]);
  return null;
}
