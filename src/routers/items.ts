import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { store } from '../store.js';
import { adminProcedure, protectedProcedure, publicProcedure, router } from '../trpc.js';

export const statusSchema = z.enum(['todo', 'doing', 'done']);

const itemOutput = z.object({
  id: z.string(),
  title: z.string(),
  status: statusSchema,
  ownerId: z.string(),
  createdAt: z.date(),
});

function getOrThrow(id: string) {
  const item = store.get(id);
  if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: `Item ${id} not found` });
  return item;
}

export const itemsRouter = router({
  list: publicProcedure
    .input(z.object({ status: statusSchema.optional() }).optional())
    .query(({ input }) => store.list(input ?? {})),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .output(itemOutput)
    .query(({ input }) => getOrThrow(input.id)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(2).max(100),
        status: statusSchema.default('todo'),
      }),
    )
    .mutation(({ input, ctx }) => store.create({ ...input, ownerId: ctx.user.id })),

  setStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: statusSchema }))
    .mutation(({ input, ctx }) => {
      const item = getOrThrow(input.id);
      if (item.ownerId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your item' });
      }
      return store.update(input.id, { status: input.status })!;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      getOrThrow(input.id);
      store.delete(input.id);
      return { id: input.id, deleted: true as const };
    }),
});
