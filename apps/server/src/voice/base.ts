export type TTSOptions = {
  style?: string;        // "cheerful", "angry", "narration-professional"...
  styleDegree?: number;  // (Azure) 0..2 - ignoré par OpenAI/ElevenLabs
  rate?: string;         // "+0%", "-10%"
  pitch?: string;        // "+0%", "+2st"
};

export interface TTSProvider {
  synthesizeMP3(voiceKey: string, text: string, opt?: TTSOptions):
    Promise<ReadableStream<Uint8Array> | NodeJS.ReadableStream>;
}

// On prend d’abord les voix spécifiques au provider présent
const provider = (process.env.TTS_PROVIDER || 'none').toLowerCase();

// OpenAI presets (ex: alloy, verse, marin, cedar...)
const OPENAI = {
  narrator: process.env.OPENAI_VOICE_NARRATOR || 'marin',
  npc1: process.env.OPENAI_VOICE_NPC1 || 'alloy',
  npc2: process.env.OPENAI_VOICE_NPC2 || 'verse',
} as const;

// Azure (ex: fr-FR-DeniseNeural)
const AZURE = {
  narrator: process.env.AZURE_VOICE_NARRATOR || 'fr-FR-DeniseNeural',
  npc1: process.env.AZURE_VOICE_NPC1 || 'fr-FR-HenriNeural',
  npc2: process.env.AZURE_VOICE_NPC2 || 'fr-CA-ThierryNeural',
} as const;

// ElevenLabs: utilise des voice_ids
const ELAB = {
  narrator: process.env.ELEVENLABS_VOICE_NARRATOR || 'VOICE_ID_1',
  npc1: process.env.ELEVENLABS_VOICE_NPC1 || 'VOICE_ID_2',
  npc2: process.env.ELEVENLABS_VOICE_NPC2 || 'VOICE_ID_3',
} as const;

export const voiceMap =
  provider === 'openai' ? OPENAI
: provider === 'azure'  ? AZURE
: provider === 'elevenlabs' ? ELAB
: OPENAI; // fallback

export type LangKey = 'fr' | 'en'; // simplifié ici

export function pickVoice(role: keyof typeof voiceMap): string {
  return voiceMap[role];
}
