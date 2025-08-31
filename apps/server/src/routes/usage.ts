import express from 'express';
import { prisma } from '@storyflux/db/src/client.js';

export const usageRouter = express.Router();

usageRouter.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const u = await prisma.usage.findUnique({ where: { roomId } });
  res.json(u || null);
});

usageRouter.post('/:roomId/incr', async (req, res) => {
  const { roomId } = req.params;
  const { ttsMsOut=0, realtimeMsOut=0, textTokensIn=0, textTokensOut=0, audioTokensIn=0, audioTokensOut=0 } = req.body || {};
  const u = await prisma.usage.upsert({
    where: { roomId },
    update: {
      ttsMsOut: { increment: ttsMsOut },
      realtimeMsOut: { increment: realtimeMsOut },
      textTokensIn: { increment: textTokensIn },
      textTokensOut: { increment: textTokensOut },
      audioTokensIn: { increment: audioTokensIn },
      audioTokensOut: { increment: audioTokensOut }
    },
    create: { roomId, ttsMsOut, realtimeMsOut, textTokensIn, textTokensOut, audioTokensIn, audioTokensOut }
  });
  res.json(u);
});
