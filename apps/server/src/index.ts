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

const server = createServer(app);
const io = new Server(server, { cors: { origin: WEB_ORIGIN } });
setupWs(io);

server.listen(PORT, () => {
  console.log(`StoryFlux server on :${PORT}`);
});
