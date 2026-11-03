// Stage 1: the smallest complete tRPC program. Server and client in one file.
// Run: npx tsx examples/01-hello.ts
import type { AddressInfo } from 'node:net';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';

const t = initTRPC.create();

const appRouter = t.router({
  greet: t.procedure
    .input(z.object({ name: z.string().min(1) }))
    .query(({ input }) => ({ message: `Hello, ${input.name}` })),
});

// Only this type crosses to the client. No code generation, no schema file.
type AppRouter = typeof appRouter;

const server = createHTTPServer({ router: appRouter });
server.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const { port } = server.address() as AddressInfo;

const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `http://127.0.0.1:${port}` })],
});

const res = await client.greet.query({ name: 'tRPC' });
console.log(res.message); // Hello, tRPC

server.close();
