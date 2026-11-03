import type { IncomingHttpHeaders } from 'node:http';

export type Role = 'member' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Context {
  user: User | null;
  requestId: string;
}

// Demo-only token table. A real app verifies a JWT or looks up a session here.
const DEMO_TOKENS: Record<string, User> = {
  'demo-member-token': { id: 'u_1', name: 'Asha', role: 'member' },
  'demo-admin-token': { id: 'u_2', name: 'Ravi', role: 'admin' },
};

export function userFromHeaders(headers: IncomingHttpHeaders): User | null {
  const header = headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return DEMO_TOKENS[header.slice('Bearer '.length)] ?? null;
}

let counter = 0;

// Called once per HTTP request (once per batch, not once per procedure).
export function createContext({ req }: { req: { headers: IncomingHttpHeaders } }): Context {
  counter += 1;
  return { user: userFromHeaders(req.headers), requestId: `req_${counter}` };
}
