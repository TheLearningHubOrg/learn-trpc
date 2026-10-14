import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Logging and timing middleware
const loggerMiddleware = middleware(async (opts) => {
  const start = Date.now();
  const result = await opts.next();
  const durationMs = Date.now() - start;
  console.log(`[tRPC] ${opts.type} '${opts.path}': ${result.ok ? 'OK' : 'ERROR'} (${durationMs}ms)`);
  return result;
});

export const loggedProcedure = publicProcedure.use(loggerMiddleware);

// Protected procedure requiring authentication
export const protectedProcedure = loggedProcedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must provide a valid Bearer token to access this procedure'
    });
  }
  return opts.next({
    ctx: {
      user: opts.ctx.user
    }
  });
});
