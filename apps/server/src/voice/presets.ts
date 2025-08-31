import type { TTSOptions } from './base.js';

export type TTSPresetKey =
  | 'narrator_radio_fr'
  | 'npc_dwarf_gruff_fr'
  | 'npc_elf_aerial_fr'
  | 'npc_orc_guttural_fr';

function v(role: 'narrator'|'npc1'|'npc2'): string {
  if (role === 'narrator') return process.env.OPENAI_VOICE_NARRATOR || process.env.OPENAI_VOICE_MALE || 'alloy';
  if (role === 'npc1')     return process.env.OPENAI_VOICE_PNJ1     || 'verse';
  return process.env.OPENAI_VOICE_PNJ2 || 'coral';
}

export function getTTSPreset(key: TTSPresetKey): { name:string; voice:string; opt:TTSOptions } | null {
  switch (key) {
    case 'narrator_radio_fr':
      return {
        name: 'Narrateur radio FR (neutre/posé)',
        voice: v('narrator'),
        opt: {
          style: [
            'Langue: français (France)',
            'Style: narration radiophonique (conte), voix chaude, posée',
            'Timbre: légèrement grave, articulation claire',
            'Énergie: maîtrisée, intensité progressive'
          ].join(' | '),
          rate: '-5%',
          pitch: '-1st'
        }
      };
    case 'npc_dwarf_gruff_fr':
      return {
        name: 'PNJ nain (bourru, comique)',
        voice: v('npc1'),
        opt: { style: 'FR-France | Timbre: rocailleux | Caractère: bourru, râleur, comédie', rate: '-3%', pitch: '-4st' }
      };
    case 'npc_elf_aerial_fr':
      return {
        name: 'PNJ elfe (aérien, espiègle)',
        voice: v('npc2'),
        opt: { style: 'FR-France | Timbre: clair et musical | Caractère: léger, espiègle', rate: '+2%', pitch: '+2st' }
      };
    case 'npc_orc_guttural_fr':
      return {
        name: 'PNJ orc (guttural, barbare)',
        voice: v('npc1'),
        opt: { style: 'FR-France | Timbre: guttural | Caractère: grondant, intimidant', rate: '-4%', pitch: '-5st' }
      };
    default:
      return null;
  }
}
