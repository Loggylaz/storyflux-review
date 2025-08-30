import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';

export type Ctx = {
  userId?: string;
  lang: 'fr' | 'en';
};

export const t = initTRPC.context<Ctx>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
    };
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;
