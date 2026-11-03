import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { TRPCClientError } from '@trpc/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { makeClient } from '../src/client.js';
import type { AppRouter } from '../src/routers/index.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createApp();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
});

describe('HTTP transport', () => {
  it('serves /health for container probes', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('answers a raw GET query with the tRPC JSON envelope', async () => {
    const res = await fetch(`${baseUrl}/trpc/system.health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: { data: { status: string } } };
    expect(body.result.data.status).toBe('ok');
  });

  it('batches parallel calls from the typed client', async () => {
    const client = makeClient(baseUrl, 'demo-member-token');
    const [health, me] = await Promise.all([
      client.system.health.query(),
      client.system.whoami.query(),
    ]);
    expect(health.status).toBe('ok');
    expect(me?.name).toBe('Asha');
  });

  it('maps TRPCError codes to HTTP status and exposes zodError on the client', async () => {
    const client = makeClient(baseUrl, 'demo-member-token');
    const err = await client.items.create.mutate({ title: '' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TRPCClientError);
    const e = err as TRPCClientError<AppRouter>;
    expect(e.data?.code).toBe('BAD_REQUEST');
    expect(e.data?.httpStatus).toBe(400);
    expect(e.data?.zodError?.fieldErrors.title?.length).toBeGreaterThan(0);
  });

  it('returns 401 without a token', async () => {
    const res = await fetch(`${baseUrl}/trpc/items.create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'No token' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 outside /trpc and /health', async () => {
    const res = await fetch(`${baseUrl}/nope`);
    expect(res.status).toBe(404);
  });
});
