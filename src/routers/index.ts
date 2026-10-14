import { router } from '../trpc.js';
import { itemsRouter } from './items.js';
import { metricsRouter } from './metrics.js';

export const appRouter = router({
  items: itemsRouter,
  metrics: metricsRouter
});

export type AppRouter = typeof appRouter;
