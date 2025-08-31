import type { TTSProvider, TTSOptions } from './base.js';

const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = (process.env.AZURE_SPEECH_REGION || 'westeurope').trim();
const ENDPOINT = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

/** Styles Azure plausibles et largement supportés par les FR-Neural. */
const SUPPORTED_STYLES: Record<string, Set<string>> = {
  'fr-FR-DeniseNeural': new Set(['cheerful','serious','angry','sad','calm','friendly','customerservice','assistant','chat','newscast']),
  'fr-FR-HenriNeural' : new Set(['cheerful','serious','angry','sad','calm','friendly','customerservice','assistant','chat','newscast']),
  'fr-FR-PaulNeural'  : new Set(['cheerful','serious','angry','sad','calm','friendly','customerservice','assistant','chat','newscast']),
  'fr-FR-ArianeNeural': new Set(['cheerful','serious','angry','sad','calm','friendly','customerservice','assistant','chat','newscast']),
};

function styleFromFreeText(free?: string, voice='fr-FR-DeniseNeural'): string | undefined {
  if (!free) return undefined;
  const s = free.toLowerCase();
  const candidates: string[] = [];
  if (s.includes('enjou')) candidates.push('cheerful');
  if (s.includes('joye'))  candidates.push('cheerful');
  if (s.includes('calm'))  candidates.push('calm');
  if (s.includes('repos') || s.includes('doux')) candidates.push('calm');
  if (s.includes('séri') || s.includes('serio')) candidates.push('serious');
  if (s.includes('angr') || s.includes('coler') || s.includes('bourru')) candidates.push('angry');
  if (s.includes('triste') || s.includes('sad')) candidates.push('sad');
  if (s.includes('ami') || s.includes('friendly')) candidates.push('friendly');
  if (s.includes('service') || s.includes('client')) candidates.push('customerservice');
  if (s.includes('assistant')) candidates.push('assistant');
  if (s.includes('newscast') || s.includes('journal') || s.includes('narrat')) candidates.push('newscast');
  const supported = SUPPORTED_STYLES[voice] || SUPPORTED_STYLES['fr-FR-DeniseNeural'];
  for (const c of candidates) if (supported.has(c)) return c;
  return undefined;
}

/** Convertit "±Nst" (demi-tons) en pourcentage approximatif pour Azure. */
function normalizePitch(p?: string): string | undefined {
  if (!p) return undefined;
  const m = p.trim().match(/^([+-]?)(\d+)st$/i);
  if (!m) {
    // on accepte aussi "+5%" ou "-8%"
    if (/^[+-]?\d+%$/.test(p.trim())) return p.trim();
    return undefined;
  }
  const sign = m[1] === '-' ? -1 : 1;
  const st = sign * parseInt(m[2], 10);
  const ratio = Math.pow(2, st / 12); // 12 demi-tons = double fréquence
  const pct = Math.round((ratio - 1) * 100);
  return (pct >= 0 ? `+${pct}%` : `${pct}%`);
}

function normalizeRate(r?: string): string | undefined {
  if (!r) return undefined;
  const t = r.trim();
  if (/^[+-]?\d+%$/.test(t)) return t;
  if (/^[+-]?\d+(\.\d+)?$/.test(t)) return `${t}%`;
  return undefined;
}

/** Construit un SSML valide avec namespaces + style si supporté. */
function ssmlFrom(text: string, voice: string, opt?: TTSOptions) {
  const lang = 'fr-FR'; // force FR-France
  const rate = normalizeRate(opt?.rate) || '+0%';
  const pitch = normalizePitch(opt?.pitch) || '+0%';

  // mappe style libre → style Azure supporté par cette voix
  const azureStyle = styleFromFreeText(opt?.style, voice);

  // IMPORTANT : namespaces SSML + mstts
  const openSpeak = `<speak version="1.0" xml:lang="${lang}" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">`;
  const closeSpeak = `</speak>`;

  const prosody = `<prosody rate="${rate}" pitch="${pitch}">${escapeXml(text)}</prosody>`;
  const voiced =
    azureStyle
      ? `<voice name="${voice}"><mstts:express-as style="${azureStyle}">${prosody}</mstts:express-as></voice>`
      : `<voice name="${voice}">${prosody}</voice>`;

  return `<?xml version="1.0" encoding="utf-8"?>\n${openSpeak}\n  ${voiced}\n${closeSpeak}`;
}

function escapeXml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export class AzureTTS implements TTSProvider {
  async synthesizeMP3(voiceKey: string, text: string, opt?: TTSOptions) {
    if (!AZURE_KEY) throw new Error('AZURE_SPEECH_KEY missing');

    // Par sécurité : si la voix ne fait pas partie de nos FR connus, on bascule sur Denise
    const voice = SUPPORTED_STYLES[voiceKey] ? voiceKey : 'fr-FR-DeniseNeural';
    const ssml = ssmlFrom(text, voice, opt);

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
        'User-Agent': 'StoryFlux/tts'
      },
      body: ssml
    });

    if (!res.ok || !res.body) {
      const t = await res.text().catch(()=> '');
      // Log utile pour debug styles non supportés / XML invalide
      console.error('[AZURE TTS] HTTP', res.status, t.slice(0, 300));
      throw new Error(`AZURE_TTS_FAILED_${res.status}: ${t}`);
    }
    return res.body as unknown as ReadableStream<Uint8Array>;
  }
}
