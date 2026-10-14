import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './routers/index.js';
import { createContext } from './context.js';

const port = Number(process.env.PORT) || 4000;

const server = createHTTPServer({
  router: appRouter,
  createContext
});

server.listen(port);
console.log(`[learn-trpc] Standalone tRPC server listening on http://localhost:${port}`);
