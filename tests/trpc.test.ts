import { describe, it } from 'node:test';
import assert from 'node:assert';
import { appRouter } from '../src/routers/index.js';

describe('tRPC Server Caller Unit & Integration Tests', () => {
  const caller = appRouter.createCaller({
    startTime: Date.now(),
    user: { id: 'test_user', role: 'admin' }
  });

  it('metrics.health should return system status', async () => {
    const health = await caller.metrics.health();
    assert.strictEqual(health.status, 'healthy');
    assert.ok(typeof health.uptimeSeconds === 'number');
    assert.ok(health.memoryUsageMb > 0);
  });

  it('items.list should return existing default items', async () => {
    const items = await caller.items.list();
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 2);
    assert.strictEqual(items[0].id, '1');
  });

  it('items.byId should return the matching item', async () => {
    const item = await caller.items.byId({ id: '1' });
    assert.strictEqual(item.id, '1');
    assert.strictEqual(item.status, 'completed');
  });

  it('items.create should validate and append a new item', async () => {
    const created = await caller.items.create({
      title: 'Automated Test Item',
      description: 'Testing caller execution without network stack',
      status: 'pending'
    });

    assert.ok(created.id);
    assert.strictEqual(created.title, 'Automated Test Item');

    const fetched = await caller.items.byId({ id: created.id });
    assert.strictEqual(fetched.title, 'Automated Test Item');
  });

  it('items.delete should remove the specified item when authenticated', async () => {
    const created = await caller.items.create({
      title: 'To Be Deleted',
      description: 'Temporary item for delete testing',
      status: 'pending'
    });

    const result = await caller.items.delete({ id: created.id });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.deletedId, created.id);
  });

  it('unauthenticated caller should fail on protected procedures', async () => {
    const unauthCaller = appRouter.createCaller({
      startTime: Date.now(),
      user: undefined
    });

    await assert.rejects(
      async () => {
        await unauthCaller.items.delete({ id: '1' });
      },
      {
        code: 'UNAUTHORIZED'
      }
    );
  });
});
