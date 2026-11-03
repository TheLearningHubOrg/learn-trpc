import { pathToFileURL } from 'node:url';
import { createTRPCClient, httpBatchLink, loggerLink, TRPCClientError } from '@trpc/client';
import type { AppRouter, RouterOutputs } from './routers/index.js';

export function makeClient(baseUrl: string, token?: string) {
  return createTRPCClient<AppRouter>({
    links: [
      loggerLink({ enabled: () => process.env.TRPC_LOG === '1' }),
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers: () => (token ? { authorization: `Bearer ${token}` } : {}),
      }),
    ],
  });
}

export type Item = RouterOutputs['items']['create'];

async function main() {
  const baseUrl = process.env.API_URL ?? 'http://localhost:8080';
  const client = makeClient(baseUrl, 'demo-member-token');

  // Both calls start in the same tick, so httpBatchLink sends one HTTP request.
  const [health, items] = await Promise.all([
    client.system.health.query(),
    client.items.list.query(),
  ]);
  console.log('health:', health.status, '| items:', items.length);

  const created: Item = await client.items.create.mutate({ title: 'Ship the client' });
  console.log('created:', created.id, created.title);

  try {
    await client.items.delete.mutate({ id: created.id });
  } catch (err) {
    if (err instanceof TRPCClientError) console.log('delete refused:', err.data?.code);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
