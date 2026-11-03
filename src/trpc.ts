import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create({
  // Adds a flattened Zod error to every BAD_REQUEST caused by input validation.
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    return {
      ...shape,
      data: {
        ...shape.data,
        // Typed as a string-keyed record so clients can read fieldErrors.title etc.
        zodError:
          cause instanceof z.ZodError
            ? z.flattenError(cause as z.ZodError<Record<string, unknown>>)
            : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;

const timing = t.middleware(async ({ path, type, next }) => {
  const start = performance.now();
  const result = await next();
  const ms = (performance.now() - start).toFixed(1);
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[trpc] ${type} ${path} ${result.ok ? 'ok' : 'error'} ${ms}ms`);
  }
  return result;
});

export const publicProcedure = t.procedure.use(timing);

// Narrows ctx.user from `User | null` to `User` for every procedure built on it.
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Send a Bearer token' });
  }
  return next({ ctx: { user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admins only' });
  }
  return next();
});
