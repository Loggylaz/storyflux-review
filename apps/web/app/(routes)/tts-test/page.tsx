'use client';
import { useMemo, useState } from 'react';
import SmartTTS from '@/src/components/SmartTTS';

type Actor = {
  gender?: 'male'|'female'|'neutral';
  species?: string;
  size?: 'small'|'medium'|'large';
  accent?: string;
  mood?: string;
  age?: 'child'|'young'|'adult'|'elder';
};

export default function TTSTestPage() {
  const [text, setText] = useState<string>(
    'Bonsoir à tous. Au cœur des monts brumeux, une lueur s’allume — et l’histoire commence.'
  );
  const [role, setRole] = useState<'narrator'|'npc1'|'npc2'>('narrator');

  // Mode preset
  const [usePreset, setUsePreset] = useState<boolean>(true);
  const [preset, setPreset] = useState<'narrator_radio_fr'|'npc_dwarf_gruff_fr'|'npc_elf_aerial_fr'|'npc_orc_guttural_fr'>('narrator_radio_fr');

  // Mode traits libres (si usePreset=false)
  const [gender, setGender] = useState<Actor['gender']>('male');
  const [species, setSpecies] = useState<string>('humain');
  const [size, setSize] = useState<Actor['size']>('medium');
  const [accent, setAccent] = useState<string>('neutre');
  const [mood, setMood] = useState<string>('calme');
  const [age, setAge] = useState<Actor['age']>('adult');
  const [style, setStyle] = useState<string>('Langue: français (France) | narration posée, radiophonique');

  const [playFlag, setPlayFlag] = useState<number>(0);

  const actor = useMemo<Actor>(() => ({
    gender: gender || 'neutral',
    species: species || undefined,
    size: size || undefined,
    accent: accent || undefined,
    mood: mood || undefined,
    age: age || undefined
  }), [gender, species, size, accent, mood, age]);

  return (
    <div style={{maxWidth: 900, margin: '0 auto', padding: 16}}>
      <h2>Test TTS (serveur)</h2>

      <div style={{marginTop:8}}>
        <label>Texte à dire</label>
        <textarea rows={4} value={text} onChange={e=>setText(e.target.value)} style={{width:'100%'}}/>
      </div>

      <div style={{display:'flex', gap:12, marginTop:12}}>
        <div>
          <label>Role</label>
          <div style={{display:'flex', gap:8, marginTop:4}}>
            <label><input type="radio" name="role" checked={role==='narrator'} onChange={()=>setRole('narrator')} /> narrateur</label>
            <label><input type="radio" name="role" checked={role==='npc1'} onChange={()=>setRole('npc1')} /> npc1</label>
            <label><input type="radio" name="role" checked={role==='npc2'} onChange={()=>setRole('npc2')} /> npc2</label>
          </div>
        </div>

        <div>
          <label>Mode</label>
          <div style={{display:'flex', gap:8, marginTop:4}}>
            <label><input type="radio" name="mode" checked={usePreset} onChange={()=>setUsePreset(true)} /> Preset</label>
            <label><input type="radio" name="mode" checked={!usePreset} onChange={()=>setUsePreset(false)} /> Traits libres</label>
          </div>
        </div>
      </div>

      {usePreset ? (
        <div style={{marginTop:12}}>
          <label>Preset</label>
          <select value={preset} onChange={e=>setPreset(e.target.value as any)} style={{width: '100%', marginTop:4}}>
            <option value="narrator_radio_fr">Narrateur radio FR (neutre)</option>
            <option value="npc_dwarf_gruff_fr">PNJ nain (bourru)</option>
            <option value="npc_elf_aerial_fr">PNJ elfe (aérien)</option>
            <option value="npc_orc_guttural_fr">PNJ orc (guttural)</option>
          </select>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
          <div>
            <label>Genre</label>
            <select value={gender||'neutral'} onChange={e=>setGender(e.target.value as any)} style={{width:'100%'}}>
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="neutral">neutral</option>
            </select>
          </div>
          <div>
            <label>Taille</label>
            <select value={size||''} onChange={e=>setSize((e.target.value||'') as any)} style={{width:'100%'}}>
              <option value="small">small</option>
              <option value="medium">medium</option>
              <option value="large">large</option>
            </select>
          </div>
          <div>
            <label>Espèce</label>
            <input value={species} onChange={e=>setSpecies(e.target.value)} placeholder="nain / elfe / orc / humain" style={{width:'100%'}}/>
          </div>
          <div>
            <label>Accent</label>
            <input value={accent} onChange={e=>setAccent(e.target.value)} placeholder="neutre, nain, elfique, marseillais..." style={{width:'100%'}}/>
          </div>
          <div>
            <label>Humeur</label>
            <input value={mood} onChange={e=>setMood(e.target.value)} placeholder="calme, enjoué, sérieux..." style={{width:'100%'}}/>
          </div>
          <div>
            <label>Style libre</label>
            <input value={style} onChange={e=>setStyle(e.target.value)} placeholder="instructions supplémentaires (FR-France, radiophonique…)" style={{width:'100%'}}/>
          </div>
        </div>
      )}

      <div style={{marginTop:12, display:'flex', gap:8}}>
        <button onClick={()=>setPlayFlag(n=>n+1)}>▶ Lire (serveur)</button>
        <span style={{opacity:0.7}}>
          {usePreset
            ? 'Utilise un preset de voix (ex: narrateur radio FR).'
            : 'Calibre via traits (genre, espèce, accent…).'}
        </span>
      </div>

      {/* Déclenchement lecture */}
      {playFlag>0 && (
        <SmartTTS
          key={playFlag}
          text={text}
          role={role}
          style={usePreset ? undefined : style}
          traits={usePreset ? undefined : {
            gender, species, size, accent, mood, age
          }}
          // @ts-ignore on passe le preset brut, géré côté serveur
          preset={usePreset ? preset : undefined}
        />
      )}
    </div>
  );
}
