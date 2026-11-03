import { createServer, type Server } from 'node:http';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { createContext } from './context.js';
import { appRouter } from './routers/index.js';

export const TRPC_PREFIX = '/trpc';

// One node:http server: a plain /health route for probes, tRPC under /trpc.
export function createApp(): Server {
  const trpc = createHTTPHandler({
    router: appRouter,
    createContext,
    basePath: `${TRPC_PREFIX}/`,
    onError({ path, error }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') console.error(`[trpc] ${path}:`, error);
    },
  });

  return createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://internal');
    if (pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    if (pathname.startsWith(`${TRPC_PREFIX}/`)) {
      trpc(req, res);
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });
}
