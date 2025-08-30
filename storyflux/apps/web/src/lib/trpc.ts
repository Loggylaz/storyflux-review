import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@storyflux/server/src/routers/root'; // types via ts path if available

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${SERVER}/trpc`,
      headers() { return { 'x-lang': 'fr' }; }
    })
  ]
});
