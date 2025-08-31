import express from 'express';


const MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';
export const mjRouter = express.Router();

type Actor = {
  name?: string;
  gender?: 'male'|'female'|'neutral';
  species?: string;
  size?: 'small'|'medium'|'large';
  accent?: string;
  mood?: string;
  age?: 'child'|'young'|'adult'|'elder';
};

type Seg = { kind:'NARRATE'|'NPC'; text:string; role:'narrator'|'npc1'|'npc2'; style?:string; actor?: Actor };


function mockSegments(locale='fr', sceneSummary='', actions:any[]=[]): { segments: Seg[] } {
  return {
    segments: [
      { kind: 'NARRATE', role: 'narrator', style: 'narration-professionnelle', text: `(${locale}) ${sceneSummary}` },
      { kind: 'NPC', role: 'npc1', style: 'bourru', text: `« Qu'est-ce que vous prenez ? » grogne le tavernier.`, actor: { name:'Tavernier', gender:'male', species:'human', accent:'marseillais', mood:'gruff', age:'adult' } },
      { kind: 'NPC', role: 'npc2', style: 'enjoué', text: `« Une bière pour moi, merci ! »`, actor: { name:'Serveuse', gender:'female', species:'elf', mood:'cheerful', age:'young' } },
      { kind: 'NARRATE', role: 'narrator', style: 'calme', text: `Que faites-vous ${actions.map((a:any)=>a.name).join(', ')} ?` }
    ]
  };
}

mjRouter.post('/narrate', async (req, res) => {
  const { locale='fr', sceneSummary='', actions=[] } = req.body || {};
  const API_KEY = process.env.OPENAI_API_KEY;

  const sys = `Tu es un Maître du Jeu 5e francophone. Réponds STRICTEMENT en un JSON unique:
{"segments":[
 { "kind":"NARRATE","text":string,"role":"narrator","style":string },
 { "kind":"NPC","text":string,"role":"npc1"|"npc2","style":string,
   "actor":{"name":string,"gender":"male"|"female"|"neutral","species":string,"size":"small"|"medium"|"large","accent":string,"mood":string,"age":"child"|"young"|"adult"|"elder"}
 }
]}

Prosodie VIVANTE exigée: dans chaque "text", tu peux insérer des marqueurs si utile:
[breath]  -> respiration brève (~250ms)
[pause:NNN] -> silence en millisecondes (ex: [pause:350])
[gravel:on]/[gravel:off] -> voix plus rocailleuse
[low:on]/[low:off] -> plus grave (léger)
Ponctuation: utilise "—", "…", points d’exclamation judicieusement.

Contraintes:
- 2 à 5 segments courts (<= 10s chacun).
- Français (France), sans accent nord-américain.
- Quand un PNJ parle, fournis un "actor" complet (pour guider la voix).
- N'utilise que "narrator", "npc1" ou "npc2".
- AUCUN texte hors du JSON.`;


  const user = `Résumé: ${sceneSummary}
Actions: ${actions.map((a:any)=>`${a.name}: ${a.action}`).join(' | ')}`;

  try {
    const headers: Record<string,string> = {
      'Authorization':`Bearer ${API_KEY}`,
      'Content-Type':'application/json',
    };
    if (process.env.OPENAI_ORG_ID) headers['OpenAI-Organization'] = process.env.OPENAI_ORG_ID!;
    if (process.env.OPENAI_PROJECT_ID) headers['OpenAI-Project'] = process.env.OPENAI_PROJECT_ID!;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.9,
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
      })
    });

    if (!r.ok) {
      const detail = await r.text().catch(()=> '');
      console.error('[MJ] OpenAI chat error:', r.status, detail);
      return res.json(mockSegments(locale, sceneSummary, actions));
    }

    const j = await r.json();
    let segments: Seg[] = [];
    try {
      const content = j.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(content);
      segments = Array.isArray(parsed.segments) ? parsed.segments : [];
    } catch {
      const content = j.choices?.[0]?.message?.content ?? '';
      const m = content.match(/\{[\s\S]*\}$/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          segments = Array.isArray(parsed.segments) ? parsed.segments : [];
        } catch {}
      }
    }

    if (!segments.length) {
      console.warn('[MJ] JSON vide ou invalide, fallback mock.');
      return res.json(mockSegments(locale, sceneSummary, actions));
    }

    return res.json({ segments });
  } catch (e:any) {
    console.error('[MJ] Fatal error:', e?.message || e);
    return res.json(mockSegments(locale, sceneSummary, actions));
  }
});
