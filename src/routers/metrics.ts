import { router, publicProcedure } from '../trpc.js';
import type { SystemHealth } from '../types.js';

export const metricsRouter = router({
  health: publicProcedure.query(async (): Promise<SystemHealth> => {
    const mem = process.memoryUsage();
    return {
      status: 'healthy',
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  })
});
