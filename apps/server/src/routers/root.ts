import { router } from '../trpc.js';
import { roomRouter } from './room.js';
import { characterRouter } from './character.js';
import { diceRouter } from './dice.js';
import { journalRouter } from './journal.js';

export const appRouter = router({
  room: roomRouter,
  character: characterRouter,
  dice: diceRouter,
  journal: journalRouter
});
export type AppRouter = typeof appRouter;
