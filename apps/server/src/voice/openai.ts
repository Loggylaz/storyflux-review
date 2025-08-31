import type { TTSProvider, TTSOptions } from './base.js';

const API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';

/**
 * Implémentation TTS via l’API Audio Speech d’OpenAI (génère un MP3).
 * Docs officielles TTS : voir guides "Audio / Text-to-Speech".
 */
export class OpenAITTS implements TTSProvider {
  async synthesizeMP3(voiceKey: string, text: string, opt?: TTSOptions) {
    if (!API_KEY) throw new Error('OPENAI_API_KEY missing');

    // Beaucoup de contrôle passe par "instructions" (ton/émotion/vitesse)
    const instructions = [
      opt?.style ? `Style: ${opt.style}` : null,
      opt?.rate ? `Rate: ${opt.rate}` : null,
      opt?.pitch ? `Pitch: ${opt.pitch}` : null
    ].filter(Boolean).join(' | ') || 'Narration naturelle en français.';

    const body = {
      model: MODEL,
      voice: voiceKey,            // ex: 'alloy', 'marin', 'verse', 'cedar'
      input: text,
      format: 'mp3',
      instructions               // permet au modèle de "comment" parler
    };

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok || !res.body) {
      const t = await res.text().catch(()=>'');
      throw new Error(`OpenAI TTS failed: ${res.status} ${t}`);
    }
    return res.body as unknown as ReadableStream<Uint8Array>;
  }
}
