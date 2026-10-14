import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import type { Item } from '../types.js';

const itemsStore: Map<string, Item> = new Map([
  [
    '1',
    {
      id: '1',
      title: 'Master End-to-End Type Safety',
      description: 'Eliminate manual API contracts and schema mismatches forever',
      status: 'completed',
      createdAt: new Date().toISOString()
    }
  ],
  [
    '2',
    {
      id: '2',
      title: 'Setup Standalone HTTP Server',
      description: 'Deploy zero-dependency standalone Node.js adapter',
      status: 'in_progress',
      createdAt: new Date().toISOString()
    }
  ]
]);

export const itemsRouter = router({
  list: publicProcedure.query(async () => {
    return Array.from(itemsStore.values());
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = itemsStore.get(input.id);
      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Item with id ${input.id} not found`
        });
      }
      return item;
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(2).max(100),
        description: z.string().max(500).default(''),
        status: z.enum(['pending', 'in_progress', 'completed']).default('pending')
      })
    )
    .mutation(async ({ input }) => {
      const id = String(itemsStore.size + 1);
      const newItem: Item = {
        id,
        title: input.title,
        description: input.description,
        status: input.status,
        createdAt: new Date().toISOString()
      };
      itemsStore.set(id, newItem);
      return newItem;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      if (!itemsStore.has(input.id)) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Item with id ${input.id} not found`
        });
      }
      itemsStore.delete(input.id);
      return { success: true, deletedId: input.id };
    })
});
