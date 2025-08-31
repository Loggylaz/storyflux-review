import express from 'express';

const API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';

export const mjRouter = express.Router();

mjRouter.post('/narrate', async (req, res) => {
  const { locale='fr', sceneSummary='', actions=[] } = req.body || {};
  if (!API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY missing' });

  const sys = `Tu es un Maître du Jeu de JDR 5e, francophone. Tu réponds en JSON parsable:
{"segments":[{ "kind": "NARRATE"|"NPC", "text": string, "role": "narrator"|"npc1"|"npc2", "style": string }]}`;
  const user = `Résumé scène: ${sceneSummary}
Actions joueurs: ${actions.map((a:any)=>`${a.name}: ${a.action}`).join(' | ')}
Donne 2-5 segments courts (<=10s), avec style/ton par PNJ.`;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{'Authorization':`Bearer ${API_KEY}`,'Content-Type':'application/json'},
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_object' }
    })
  });

  if (!r.ok) {
    const t = await r.text().catch(()=> '');
    return res.status(500).json({ error: 'llm_failed', detail: t });
  }
  const j = await r.json();
  let segments: any[] = [];
  try {
    const content = j.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);
    segments = parsed.segments ?? [];
  } catch { segments = []; }
  res.json({ segments });
});
