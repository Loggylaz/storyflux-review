import type { TTSOptions } from './base.js';

export type VoiceTraits = {
  gender?: 'male'|'female'|'neutral';
  species?: string;
  size?: 'small'|'medium'|'large';
  accent?: string;
  mood?: string;
  age?: 'child'|'young'|'adult'|'elder';
};

/* -------------------- OpenAI (FR-France via instructions) -------------------- */

const OAI_MALE    = process.env.OPENAI_VOICE_MALE    || 'alloy';
const OAI_FEMALE  = process.env.OPENAI_VOICE_FEMALE  || 'verse';
const OAI_NEUTRAL = process.env.OPENAI_VOICE_NEUTRAL || 'nova';

function buildStyle(traits?: VoiceTraits, baseStyle?: string) {
  const parts: string[] = [];
  if (baseStyle) parts.push(baseStyle);
  if (!traits) {
    parts.push('Langue: français (France), diction naturelle, sans accent anglophone');
    return parts.join(' | ');
  }

  if (traits.mood) parts.push(`Caractère: ${traits.mood}`);
  if (traits.accent) parts.push(`Accent: ${traits.accent}`);
  if (traits.species) {
    const sp = traits.species.toLowerCase();
    if (sp === 'dwarf' || sp === 'nain')     parts.push('Timbre: rocailleux');
    if (sp === 'elf' || sp === 'elfe')       parts.push('Timbre: doux et musical');
    if (sp === 'orc' || sp === 'orque')      parts.push('Timbre: guttural');
    if (sp === 'gnome' || sp === 'halfling') parts.push('Timbre: léger');
  }
  parts.push('Langue: français (France), diction naturelle, sans accent anglophone');
  return parts.join(' | ');
}

export function chooseOpenAIVoice(traits?: VoiceTraits): { voice: string; opt: TTSOptions } {
  let gender: VoiceTraits['gender'] = traits?.gender || 'neutral';
  let voice = gender === 'male' ? OAI_MALE : gender === 'female' ? OAI_FEMALE : OAI_NEUTRAL;

  // “couleur” attendue selon espèces/taille/âge (léger, affiné côté client par playbackRate)
  let pitchSteps = 0;
  let rate = '0%';

  const sp = traits?.species?.toLowerCase();
  if (sp === 'dwarf' || sp === 'nain')        { pitchSteps -= 3; gender = 'male'; voice = OAI_MALE; }
  if (sp === 'orc' || sp === 'orque')         { pitchSteps -= 4; gender = 'male'; voice = OAI_MALE; }
  if (sp === 'elf' || sp === 'elfe')          { pitchSteps += 2; }
  if (traits?.size === 'large')               pitchSteps -= 2;
  if (traits?.size === 'small')               pitchSteps += 1;
  if (traits?.age  === 'elder')               rate = '-5%';
  if (traits?.age  === 'child')               rate = '+5%';

  const opt: TTSOptions = {
    style: buildStyle(traits),
    pitch: pitchSteps ? (pitchSteps>0?`+${pitchSteps}st`:`${pitchSteps}st`) : undefined,
    rate,
  };
  return { voice, opt };
}

/* -------------------- Azure (si jamais tu rebascules dessus) -------------------- */

const AZ_MALE    = 'fr-FR-HenriNeural';
const AZ_FEMALE  = 'fr-FR-DeniseNeural';
const AZ_NEUTRAL = 'fr-FR-DeniseNeural';

export function chooseAzureVoice(traits?: VoiceTraits): { voice: string; opt: TTSOptions } {
  let gender: VoiceTraits['gender'] = traits?.gender || 'neutral';
  let voice = gender === 'male' ? AZ_MALE : gender === 'female' ? AZ_FEMALE : AZ_NEUTRAL;

  let pitchSteps = 0;
  let rate = '+0%';

  const sp = traits?.species?.toLowerCase();
  if (sp === 'dwarf' || sp === 'nain')        { pitchSteps -= 3; gender = 'male'; voice = AZ_MALE; }
  if (sp === 'orc' || sp === 'orque')         { pitchSteps -= 4; gender = 'male'; voice = AZ_MALE; }
  if (sp === 'elf' || sp === 'elfe')          { pitchSteps += 2; }
  if (traits?.size === 'large')               pitchSteps -= 2;
  if (traits?.size === 'small')               pitchSteps += 1;
  if (traits?.age  === 'elder')               rate = '-5%';
  if (traits?.age  === 'child')               rate = '+5%';

  const opt: TTSOptions = {
    style: buildStyle(traits),
    pitch: pitchSteps ? (pitchSteps>0?`+${pitchSteps}st`:`${pitchSteps}st`) : undefined,
    rate,
  };
  return { voice, opt };
}

/* -------------------- Wrapper unique -------------------- */

export function chooseVoice(traits?: VoiceTraits) {
  const prov = (process.env.TTS_PROVIDER || 'openai').toLowerCase();
  return prov === 'azure' ? chooseAzureVoice(traits) : chooseOpenAIVoice(traits);
}
