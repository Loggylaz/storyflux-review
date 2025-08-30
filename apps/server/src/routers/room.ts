import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { prisma } from '@storyflux/db/src/client.js';
import crypto from 'node:crypto';

export const roomRouter = router({
  create: publicProcedure
    .input(z.object({ name: z.string().min(2).max(64), createdByName: z.string().min(1), lang: z.enum(['fr','en']).default('fr') }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.create({ data: { displayName: input.createdByName, lang: input.lang } });
      const room = await prisma.room.create({
        data: {
          name: input.name,
          seedWorld: crypto.randomBytes(8).toString('hex'),
          isPrivate: true,
          createdByUserId: user.id
        }
      });
      await prisma.roomMember.create({ data: { roomId: room.id, userId: user.id, role: 'gm' } });

      const token = crypto.randomBytes(24).toString('hex');
      const session = await prisma.session.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) }
      });

      return { roomId: room.id, sessionToken: session.token, userId: user.id, role: 'gm' as const };
    }),

  join: publicProcedure
    .input(z.object({ roomId: z.string(), displayName: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({ where: { id: input.roomId } });
      if (!room) throw new Error('Room not found');

      const user = await prisma.user.create({ data: { displayName: input.displayName, lang: 'fr' } });
      await prisma.roomMember.create({ data: { roomId: room.id, userId: user.id, role: 'player' } });

      const token = crypto.randomBytes(24).toString('hex');
      const session = await prisma.session.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) }
      });

      return { roomId: room.id, sessionToken: session.token, userId: user.id, role: 'player' as const };
    })
});
