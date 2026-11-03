// Stage 3: data transformers. Without one, Date becomes string on the wire and in the types.
// Run: npx tsx examples/03-superjson.ts
import type { AddressInfo } from 'node:net';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import superjson from 'superjson';

const t = initTRPC.create({ transformer: superjson });

const appRouter = t.router({
  snapshot: t.procedure.query(() => ({
    at: new Date('2026-01-01T00:00:00Z'),
    tags: new Set(['a', 'b']),
    big: 2n ** 64n,
  })),
});
type AppRouter = typeof appRouter;

const server = createHTTPServer({ router: appRouter });
server.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const { port } = server.address() as AddressInfo;

const client = createTRPCClient<AppRouter>({
  // v11: the transformer is configured on the terminating link, not on the client root.
  links: [httpBatchLink({ url: `http://127.0.0.1:${port}`, transformer: superjson })],
});

const snap = await client.snapshot.query();
console.log(snap.at instanceof Date, snap.tags.has('b'), typeof snap.big); // true true bigint

server.close();
