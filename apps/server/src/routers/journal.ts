import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { prisma } from '@storyflux/db/src/client.js';

export const journalRouter = router({
  list: publicProcedure
    .input(z.object({ roomId: z.string(), limit: z.number().int().min(1).max(200).optional() }))
    .query(async ({ input }) => {
      const limit = input.limit ?? 50;
      const items = await prisma.journalEntry.findMany({
        where: { roomId: input.roomId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return items;
    }),

  add: publicProcedure
    .input(z.object({
      roomId: z.string(),
      kind: z.enum(['text', 'roll', 'system']).default('text'),
      content: z.string().min(1).max(2000)
    }))
    .mutation(async ({ input }) => {
      const item = await prisma.journalEntry.create({
        data: {
          roomId: input.roomId,
          kind: input.kind,
          content: input.content
        }
      });
      return item;
    })
});
