import type { TTSProvider, TTSOptions } from './base.js';

const API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';

export class OpenAITTS implements TTSProvider {
  async synthesizeMP3(voiceKey: string, text: string, opt?: TTSOptions) {
    if (!API_KEY) throw new Error('OPENAI_API_KEY missing');

    const instructions =
      [opt?.style && `Style: ${opt.style}`, opt?.rate && `Rate: ${opt.rate}`, opt?.pitch && `Pitch: ${opt.pitch}`]
        .filter(Boolean).join(' | ') || 'Narration naturelle en français.';

    const body = { model: MODEL, voice: voiceKey, input: text, format: 'mp3', instructions };

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok || !res.body) {
      const t = await res.text().catch(()=> '');
      throw new Error(`OpenAI TTS failed: ${res.status} ${t}`);
    }
    return res.body as unknown as ReadableStream<Uint8Array>;
  }
}
