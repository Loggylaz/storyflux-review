import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { prisma } from '@storyflux/db/src/client.js';
import crypto from 'node:crypto';

function sign(result: number, die: string, face: number, modifier: number, roomId: string, userId?: string) {
  const secret = process.env.SECRET_ROLL_SALT ?? 'dev-secret';
  const payload = `${die}|${face}|${result}|${modifier}|${roomId}|${userId ?? ''}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export const diceRouter = router({
  rollD20: publicProcedure
    .input(z.object({ roomId: z.string(), userId: z.string().optional(), modifier: z.number().int().default(0) }))
    .mutation(async ({ input }) => {
      const result = crypto.randomInt(1, 21);
      const signature = sign(result, 'd20', 20, input.modifier, input.roomId, input.userId);
      const roll = await prisma.roll.create({
        data: {
          roomId: input.roomId,
          userId: input.userId,
          die: 'd20',
          face: 20,
          result,
          modifier: input.modifier,
          signature
        }
      });
      await prisma.journalEntry.create({
        data: {
          roomId: input.roomId,
          kind: 'roll',
          content: JSON.stringify({ userId: input.userId, die: 'd20', result, modifier: input.modifier })
        }
      });
      return roll;
    })
});
