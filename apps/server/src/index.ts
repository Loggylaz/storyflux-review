import './preload-env.js';
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/root.js';
import { t } from './trpc.js';
import { dict } from './i18n.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupWs } from './ws.js';
// ...
import { ttsRouter } from './routes/tts.js';
import { usageRouter } from './routes/usage.js';
import { mjRouter } from './routes/mj.js';



const PORT = Number(process.env.SERVER_PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

const app = express();
app.use(cors({ origin: WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use('/tts', ttsRouter);
app.use('/usage', usageRouter);
app.use('/mj', mjRouter);

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext: ({ req }) => {
    const lang = (req.headers['x-lang'] as string) ?? 'fr';
    return { lang: ['fr', 'en'].includes(lang) ? (lang as 'fr' | 'en') : 'fr' };
  },
});
app.use('/trpc', trpcMiddleware);


app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ ok: true, langs: Object.keys(dict) });
});

app.get('/envcheck', (_req, res) => {
  res.json({
    ttsProvider: process.env.TTS_PROVIDER || null,
    hasOpenAI: !!process.env.OPENAI_API_KEY
  });
});

app.get('/envpeek', (_req, res) => {
  const k = process.env.OPENAI_API_KEY || '';
  res.json({
    prefix: k.slice(0, 6),        // ex: "sk-proj" ou "sk-xxx"
    length: k.length,             // taille totale
    provider: process.env.TTS_PROVIDER || null
  });
});

app.get('/keytest', async (_req, res) => {
  try {
    const headers: Record<string,string> = {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY ?? ''}`
    };
    if (process.env.OPENAI_ORG_ID) headers['OpenAI-Organization'] = process.env.OPENAI_ORG_ID!;
    if (process.env.OPENAI_PROJECT_ID) headers['OpenAI-Project'] = process.env.OPENAI_PROJECT_ID!;
    const r = await fetch('https://api.openai.com/v1/models', { headers });
    const txt = await r.text();
    res.status(r.status).type('text/plain').send(txt);
  } catch (e:any) {
    res.status(500).send(e?.message || String(e));
  }
});

app.get('/keytest-speech', async (_req, res) => {
  try {
    const headers = {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
      ...(process.env.OPENAI_ORG_ID ? {'OpenAI-Organization': process.env.OPENAI_ORG_ID} : {}),
      ...(process.env.OPENAI_PROJECT_ID ? {'OpenAI-Project': process.env.OPENAI_PROJECT_ID} : {}),
    } as Record<string,string>;

    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || 'tts-1',
        voice: 'alloy',
        input: 'Test StoryFlux.',
        format: 'mp3'
      })
    });

    const text = await r.text();
    res.status(r.status).type('text/plain').send(text);
  } catch (e:any) {
    res.status(500).send(e?.message || String(e));
  }
});

const server = createServer(app);
const io = new Server(server, { cors: { origin: WEB_ORIGIN } });
setupWs(io);

server.listen(PORT, () => {
  console.log(`StoryFlux server on :${PORT}`);
});
