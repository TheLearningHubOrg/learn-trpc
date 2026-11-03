import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import type { Context, User } from '../src/context.js';
import { createCaller } from '../src/routers/index.js';

const member: User = { id: 'u_1', name: 'Asha', role: 'member' };
const otherMember: User = { id: 'u_9', name: 'Kiran', role: 'member' };
const admin: User = { id: 'u_2', name: 'Ravi', role: 'admin' };

const ctx = (user: User | null): Context => ({ user, requestId: 'test' });

describe('items router (server-side caller, no HTTP)', () => {
  it('lists the seeded items and filters by status', async () => {
    const caller = createCaller(ctx(null));
    const all = await caller.items.list();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const done = await caller.items.list({ status: 'done' });
    expect(done.every((i) => i.status === 'done')).toBe(true);
  });

  it('creates an item owned by the caller with the default status', async () => {
    const caller = createCaller(ctx(member));
    const item = await caller.items.create({ title: '  Learn links  ' });
    expect(item).toMatchObject({ title: 'Learn links', status: 'todo', ownerId: 'u_1' });
    expect(item.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid input with BAD_REQUEST before the resolver runs', async () => {
    const caller = createCaller(ctx(member));
    await expect(caller.items.create({ title: 'x' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('returns NOT_FOUND for a missing id', async () => {
    const caller = createCaller(ctx(null));
    const err = await caller.items.byId({ id: 'missing' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe('NOT_FOUND');
  });

  it('requires a user for mutations', async () => {
    const caller = createCaller(ctx(null));
    await expect(caller.items.create({ title: 'Anonymous' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('only lets the owner or an admin change status', async () => {
    const owner = createCaller(ctx(member));
    const item = await owner.items.create({ title: 'Owned by Asha' });

    await expect(
      createCaller(ctx(otherMember)).items.setStatus({ id: item.id, status: 'done' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const updated = await createCaller(ctx(admin)).items.setStatus({ id: item.id, status: 'done' });
    expect(updated.status).toBe('done');
  });

  it('allows delete for admins only and keeps ids unique afterwards', async () => {
    const memberCaller = createCaller(ctx(member));
    const a = await memberCaller.items.create({ title: 'First' });

    await expect(memberCaller.items.delete({ id: a.id })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(createCaller(ctx(admin)).items.delete({ id: a.id })).resolves.toEqual({
      id: a.id,
      deleted: true,
    });

    const b = await memberCaller.items.create({ title: 'Second' });
    expect(b.id).not.toBe(a.id);
  });
});
