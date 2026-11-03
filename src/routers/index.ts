import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createCallerFactory, router } from '../trpc.js';
import { itemsRouter } from './items.js';
import { systemRouter } from './system.js';

export const appRouter = router({
  items: itemsRouter,
  system: systemRouter,
});

// The only thing the client imports from the server, and only as a type.
export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const createCaller = createCallerFactory(appRouter);
