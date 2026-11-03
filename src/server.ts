import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';

const server = createApp();
server.listen(port, host, () => {
  console.log(`[learn-trpc] listening on http://${host}:${port} (tRPC at /trpc)`);
});

// Containers send SIGTERM; finish in-flight requests before exiting.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
