export type TTSOptions = {
  style?: string;        // "cheerful", "angry", "narration-professional"...
  styleDegree?: number;  // Azure seulement (0..2)
  rate?: string;         // "+0%", "-10%"
  pitch?: string;        // "+0%", "+2st"
};

export interface TTSProvider {
  synthesizeMP3(
    voiceKey: string,
    text: string,
    opt?: TTSOptions
  ): Promise<ReadableStream<Uint8Array> | NodeJS.ReadableStream>;
}

// mapping par provider (OpenAI par défaut)
const provider = (process.env.TTS_PROVIDER || 'none').toLowerCase();

const OPENAI = {
  narrator: process.env.OPENAI_VOICE_NARRATOR || 'marin',
  npc1: process.env.OPENAI_VOICE_NPC1 || 'alloy',
  npc2: process.env.OPENAI_VOICE_NPC2 || 'verse',
} as const;

const AZURE = {
  narrator: process.env.AZURE_VOICE_NARRATOR || 'fr-FR-DeniseNeural',
  npc1: process.env.AZURE_VOICE_NPC1 || 'fr-FR-HenriNeural',
  npc2: process.env.AZURE_VOICE_NPC2 || 'fr-CA-ThierryNeural',
} as const;

const ELAB = {
  narrator: process.env.ELEVENLABS_VOICE_NARRATOR || 'VOICE_ID_1',
  npc1: process.env.ELEVENLABS_VOICE_NPC1 || 'VOICE_ID_2',
  npc2: process.env.ELEVENLABS_VOICE_NPC2 || 'VOICE_ID_3',
} as const;

export const voiceMap =
  provider === 'azure' ? AZURE :
  provider === 'elevenlabs' ? ELAB :
  OPENAI;

export function pickVoice(role: keyof typeof voiceMap): string {
  return voiceMap[role];
}
