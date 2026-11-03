// Stage 3: procedure meta, reusable middleware and .concat() for plugin-style builders.
// Run: npx tsx examples/03-middleware.ts
import { initTRPC, TRPCError } from '@trpc/server';

// A "plugin" ships its own tRPC instance. It only knows the context keys it needs.
function createRateLimitPlugin(limit: number) {
  const p = initTRPC.context<{ ip: string }>().create();
  const hits = new Map<string, number>();
  return {
    procedure: p.procedure.use(({ ctx, next }) => {
      const n = (hits.get(ctx.ip) ?? 0) + 1;
      hits.set(ctx.ip, n);
      if (n > limit) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
      return next();
    }),
  };
}

interface Ctx {
  ip: string;
  userId: string | null;
}
interface Meta {
  audit?: boolean;
}

const t = initTRPC.context<Ctx>().meta<Meta>().create({ defaultMeta: { audit: false } });

const auditLog: string[] = [];
const audited = t.procedure.use(async ({ meta, path, ctx, next }) => {
  const result = await next();
  if (meta?.audit) auditLog.push(`${ctx.userId ?? 'anon'} ${path} ${result.ok ? 'ok' : 'fail'}`);
  return result;
});

const limited = audited.concat(createRateLimitPlugin(2).procedure);

const appRouter = t.router({
  transfer: limited.meta({ audit: true }).mutation(() => 'moved'),
  ping: limited.query(() => 'pong'),
});

const caller = t.createCallerFactory(appRouter)({ ip: '10.0.0.1', userId: 'u_1' });
console.log(await caller.transfer()); // moved
console.log(await caller.ping()); // pong
const third = await caller.ping().catch((e: TRPCError) => e.code);
console.log(third); // TOO_MANY_REQUESTS
console.log(auditLog); // [ 'u_1 transfer ok' ]
