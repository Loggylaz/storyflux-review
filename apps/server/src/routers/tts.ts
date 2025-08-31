import express from 'express';
import { getTTSProvider } from '../voice/index.js';
import { pickVoice } from '../voice/base.js';

export const ttsRouter = express.Router();

// POST /tts?role=narrator|npc1|npc2  body: { text: string, style?: string, styleDegree?: number, rate?: string, pitch?: string }
ttsRouter.post('/', async (req, res) => {
  const role = (req.query.role as string) || 'narrator';
  const { text, style, styleDegree, rate, pitch } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });

  const provider = getTTSProvider();
  const voiceKey = pickVoice(role as 'narrator'|'npc1'|'npc2');

  try {
    const stream = await provider.synthesizeMP3(voiceKey, text, { style, styleDegree, rate, pitch });
    // Si provider = MockTTS => lève NO_SERVER_TTS
    if (!stream) return res.status(204).end();

    res.setHeader('Content-Type', 'audio/mpeg');
    // @ts-ignore (Node stream vs WebStream)
    if (typeof (stream as any).pipe === 'function') {
      // NodeJS.ReadableStream
      (stream as any).pipe(res);
    } else {
      // Web ReadableStream
      const reader = (stream as ReadableStream<Uint8Array>).getReader();
      res.status(200);
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) return res.end();
        res.write(Buffer.from(value));
        pump();
      };
      pump();
    }
  } catch (e: any) {
    if (String(e?.message).includes('NO_SERVER_TTS')) {
      return res.status(204).end(); // pas d'audio serveur -> fallback client
    }
    console.error('TTS error', e);
    res.status(500).json({ error: 'tts_failed' });
  }
});
