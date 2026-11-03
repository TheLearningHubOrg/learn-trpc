import { publicProcedure, router } from '../trpc.js';

export const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok' as const,
    uptimeSeconds: Math.round(process.uptime()),
  })),
  whoami: publicProcedure.query(({ ctx }) => ctx.user),
});
