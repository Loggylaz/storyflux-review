import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { prisma } from '@storyflux/db/src/client.js';

export const characterRouter = router({
  create: publicProcedure
    .input(z.object({
      roomId: z.string(),
      userId: z.string(),
      name: z.string().min(1),
      race: z.string().min(1),
      class: z.string().min(1),
      ca: z.number().int().min(1).max(30),
      js: z.number().int().min(0).max(30),
      hp: z.number().int().min(1).max(999),
      stats: z.object({ str:z.number(), dex:z.number(), con:z.number(), int:z.number(), wis:z.number(), cha:z.number() }),
    }))
    .mutation(async ({ input }) => {
      const c = await prisma.character.create({
        data: {
          roomId: input.roomId,
          userId: input.userId,
          name: input.name,
          race: input.race,
          class: input.class,
          ca: input.ca,
          js: input.js,
          hp: input.hp,
          statsJSON: input.stats,
          statesJSON: {}
        }
      });
      return { id: c.id };
    })
});
