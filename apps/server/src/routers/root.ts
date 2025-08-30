import { router } from '../trpc.js';
import { roomRouter } from './room.js';
import { characterRouter } from './character.js';
import { diceRouter } from './dice.js';

export const appRouter = router({
  room: roomRouter,
  character: characterRouter,
  dice: diceRouter
});
export type AppRouter = typeof appRouter;
