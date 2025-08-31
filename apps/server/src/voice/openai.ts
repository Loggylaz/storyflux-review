import type { TTSProvider, TTSOptions } from './base.js';

const API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = (process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts').trim();
const PROJECT = (process.env.OPENAI_PROJECT_ID || '').trim();

// Liste de voix OpenAI courantes (évite les 400 si .env met une voix inconnue)
const ALLOWED_VOICES = new Set([
  'alloy','amber','copper','coral','shimmer','verse','sage','nova'
]);

function sanitizeVoice(v?: string) {
  if (v && ALLOWED_VOICES.has(v)) return v;
  console.warn('[OpenAI TTS] voix invalide ou non listée -> fallback alloy:', v);
  return 'alloy';
}

function mkInstructions(opt?: TTSOptions) {
  const parts = [
    opt?.style,
    opt?.rate && `Vitesse: ${opt.rate}`,
    opt?.pitch && `Hauteur: ${opt.pitch}`,
    'Langue: français (France)'
  ].filter(Boolean);
  const s = parts.join(' | ') || 'Narration naturelle en français (France).';
  // évite des payloads trop longs
  return s.slice(0, 600);
}

async function fetchSpeech(body: any) {
  const headers: Record<string,string> = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  if (PROJECT) headers['OpenAI-Project'] = PROJECT;
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  return res;
}

export class OpenAITTS implements TTSProvider {
  async synthesizeMP3(voiceKey: string, text: string, opt?: TTSOptions) {
    if (!API_KEY) throw new Error('OPENAI_API_KEY missing');

    const voice = sanitizeVoice(voiceKey);
    const instructions = mkInstructions(opt);

    // 1) tentative avec "instructions" (supporté par gpt-4o-mini-tts)
    let body: any = { model: MODEL, voice, input: text, format: 'mp3', instructions };
    let res = await fetchSpeech(body);

    // 2) si 400, on réessaie sans "instructions" (compat tts-1/anciens backends)
    if (res.status === 400) {
      try { await res.text(); } catch {}
      body = { model: MODEL, voice, input: text, format: 'mp3' };
      res = await fetchSpeech(body);
    }

    if (!res.ok || !res.body) {
      const t = await res.text().catch(()=> '');
      console.error('[OpenAI TTS] error', res.status, t.slice(0,400));
      throw new Error(`OPENAI_TTS_FAILED_${res.status}`);
    }
    return res.body as unknown as ReadableStream<Uint8Array>;
  }
}
