import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/index.js';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000',
      headers: () => ({
        authorization: 'Bearer secret_token'
      })
    })
  ]
});

async function main() {
  console.log('[learn-trpc-client] Querying system health...');
  const health = await client.metrics.health.query();
  console.log('[learn-trpc-client] Health:', health);

  console.log('[learn-trpc-client] Querying items list...');
  const items = await client.items.list.query();
  console.log(`[learn-trpc-client] Fetched ${items.length} items:`, items);

  console.log('[learn-trpc-client] Creating new item...');
  const created = await client.items.create.mutate({
    title: 'Client Mutation Demonstration',
    description: 'Direct typesafe RPC call from node runtime',
    status: 'in_progress'
  });
  console.log('[learn-trpc-client] Created item:', created);
}

main().catch(console.error);
