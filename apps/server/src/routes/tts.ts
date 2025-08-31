import express from 'express';
import { getTTSProvider } from '../voice/index.js';
import { pickVoice } from '../voice/base.js';
import { chooseVoice, type VoiceTraits } from '../voice/select.js';
import { getTTSPreset, type TTSPresetKey } from '../voice/presets.js';

export const ttsRouter = express.Router();

type Body = {
  text: string;
  style?: string;
  styleDegree?: number;
  rate?: string;
  pitch?: string;
  traits?: VoiceTraits;
  preset?: TTSPresetKey;
};

/** Sélectionne (sans produire l’audio) la voix et les options finales */
function resolveVoiceAndOptions(role: 'narrator'|'npc1'|'npc2', body: Body) {
  let voiceKey = pickVoice(role); // valeurs par défaut par rôle (OPENAI_VOICE_NARRATOR/PNJ…)
  let merged: any = { style: body.style, styleDegree: body.styleDegree, rate: body.rate, pitch: body.pitch };

  // 1) Preset prioritaire
  if (body.preset) {
    const p = getTTSPreset(body.preset);
    if (p) {
      voiceKey = p.voice;
      merged = {
        ...p.opt,
        style: body.style ?? p.opt.style,
        rate:  body.rate  ?? p.opt.rate,
        pitch: body.pitch ?? p.opt.pitch,
        styleDegree: body.styleDegree
      };
    }
  }

  // 2) Sinon traits (sauf si narrateur : on force la voix narrateur)
  if (!body.preset) {
    if (role === 'narrator') {
      // Narrateur = toujours voix narrateur définie en env, ignore le genre des traits
      voiceKey = process.env.OPENAI_VOICE_NARRATOR || voiceKey;
      merged.style = [merged.style || '', 'Narration posée, timbre légèrement grave, français (France), sans accent anglophone'].filter(Boolean).join(' | ');
    } else if (body.traits) {
      const pick = chooseVoice(body.traits);
      voiceKey = pick.voice;
      merged = {
        ...pick.opt,
        style: body.style ?? pick.opt.style,
        rate:  body.rate  ?? pick.opt.rate,
        pitch: body.pitch ?? pick.opt.pitch,
        styleDegree: body.styleDegree
      };
    }
  }

  return { voiceKey, opt: merged };
}

/** POST /tts?role=narrator
 * body: { text, style?, rate?, pitch?, traits?, preset? }
 */
ttsRouter.post('/', async (req, res) => {
  const role = ((req.query.role as string) || 'narrator') as 'narrator'|'npc1'|'npc2';
  const body: Body = req.body || {};
  if (!body.text || typeof body.text !== 'string') return res.status(400).json({ error: 'text required' });

  try {
    const provider = getTTSProvider();
    const { voiceKey, opt } = resolveVoiceAndOptions(role, body);

    const stream = await provider.synthesizeMP3(voiceKey, body.text, opt);
    if (!stream) return res.status(204).end();

    res.setHeader('Content-Type', 'audio/mpeg');

    // @ts-ignore Node stream vs Web stream
    if (typeof (stream as any).pipe === 'function') {
      (stream as any).pipe(res);
    } else {
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
    console.error('[TTS] fail:', e?.message || e);
    return res.status(204).end(); // fallback Web Speech
  }
});

/** GET /tts/dryrun?role=narrator  (debug: quelle voix serait utilisée ?)
 * body optionnel (JSON): { traits, preset, style, rate, pitch }
 */
ttsRouter.get('/dryrun', async (req, res) => {
  const role = ((req.query.role as string) || 'narrator') as 'narrator'|'npc1'|'npc2';
  const body: Body = typeof req.body === 'object' ? req.body : {};
  const { voiceKey, opt } = resolveVoiceAndOptions(role, body);
  res.json({
    provider: (process.env.TTS_PROVIDER || 'openai').toLowerCase(),
    role,
    voiceKey,
    opt
  });
});
