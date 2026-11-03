// Stage 2: composing routers, input/output validation and how errors map to HTTP.
// Run: npx tsx examples/02-routers.ts
import { initTRPC, TRPCError, type inferRouterInputs } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { z } from 'zod';

const t = initTRPC.create();

const usersRouter = t.router({
  get: t.procedure
    .input(z.object({ id: z.coerce.number().int().positive() }))
    .output(z.object({ id: z.number(), email: z.email() }))
    .query(({ input }) => ({ id: input.id, email: `user${input.id}@example.com` })),
});

const postsRouter = t.router({
  // Inline nesting: a plain object inside router() becomes a namespace too.
  drafts: {
    count: t.procedure.query(() => 3),
  },
});

// Two ways to compose: nest under a key, or flatten with mergeRouters.
const nested = t.router({ users: usersRouter, posts: postsRouter });
const flat = t.mergeRouters(usersRouter, postsRouter);

type Inputs = inferRouterInputs<typeof nested>;
// z.coerce accepts unknown input, so the inferred input type allows the string.
const getUserInput: Inputs['users']['get'] = { id: '42' };

const caller = t.createCallerFactory(nested)({});
console.log(await caller.users.get(getUserInput)); // { id: 42, email: ... } (coerced from "42")
console.log(await caller.posts.drafts.count()); // 3
console.log(Object.keys(flat._def.procedures)); // [ 'get', 'drafts.count' ]

for (const code of ['BAD_REQUEST', 'UNAUTHORIZED', 'NOT_FOUND', 'CONFLICT'] as const) {
  console.log(code, getHTTPStatusCodeFromError(new TRPCError({ code })));
}
