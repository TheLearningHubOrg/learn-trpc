// Stage 3: the link chain. A custom timing link, then splitLink choosing batch or single requests.
// Run: npx tsx examples/03-links.ts
import type { AddressInfo } from 'node:net';
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
  type TRPCLink,
} from '@trpc/client';
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { observable } from '@trpc/server/observable';

const t = initTRPC.create();
const appRouter = t.router({
  fast: t.procedure.query(() => 'fast'),
  slow: t.procedure.query(async () => {
    await new Promise((r) => setTimeout(r, 200));
    return 'slow';
  }),
});
type AppRouter = typeof appRouter;

let httpRequests = 0;
const server = createHTTPServer({
  router: appRouter,
  createContext: () => {
    httpRequests += 1; // createContext runs once per HTTP request
    return {};
  },
});
server.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

// A link is a function that receives runtime config and returns an operation handler.
const timingLink: TRPCLink<AppRouter> = () => {
  return ({ op, next }) =>
    observable((observer) => {
      const start = performance.now();
      const sub = next(op).subscribe({
        next: (value) => observer.next(value),
        error: (err) => observer.error(err),
        complete: () => {
          console.log(`${op.path} took ${(performance.now() - start).toFixed(0)}ms`);
          observer.complete();
        },
      });
      return () => sub.unsubscribe();
    });
};

const client = createTRPCClient<AppRouter>({
  links: [
    timingLink,
    splitLink({
      // Per-call context decides the transport. Slow calls opt out of the batch.
      condition: (op) => op.context.skipBatch === true,
      true: httpLink({ url }),
      false: httpBatchLink({ url }),
    }),
  ],
});

await Promise.all([
  client.fast.query(),
  client.fast.query(),
  client.slow.query(undefined, { context: { skipBatch: true } }),
]);
console.log('HTTP requests sent:', httpRequests); // 2: one batch with both fast calls, one single

server.close();
