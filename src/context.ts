import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';

export interface Context {
  user?: { id: string; role: string };
  startTime: number;
}

export const createContext = async (opts: CreateHTTPContextOptions): Promise<Context> => {
  const authHeader = opts.req.headers['authorization'];
  let user: { id: string; role: string } | undefined = undefined;

  if (authHeader?.startsWith('Bearer ')) {
    user = { id: 'user_123', role: 'admin' };
  }

  return {
    user,
    startTime: Date.now()
  };
};
