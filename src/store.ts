export type ItemStatus = 'todo' | 'doing' | 'done';

export interface Item {
  id: string;
  title: string;
  status: ItemStatus;
  ownerId: string;
  createdAt: Date;
}

type NewItem = Omit<Item, 'id' | 'createdAt'>;

// In-memory store. Swap it for a database client without changing the routers' public types.
export class ItemStore {
  private items = new Map<string, Item>();
  private nextId = 1;

  constructor(seed: NewItem[] = []) {
    for (const s of seed) this.create(s);
  }

  list(filter: { status?: ItemStatus } = {}): Item[] {
    const all = [...this.items.values()];
    return filter.status ? all.filter((i) => i.status === filter.status) : all;
  }

  get(id: string): Item | undefined {
    return this.items.get(id);
  }

  create(data: NewItem): Item {
    // A counter, not items.size + 1: ids must stay unique after deletes.
    const item: Item = { ...data, id: String(this.nextId++), createdAt: new Date() };
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, patch: Partial<Pick<Item, 'title' | 'status'>>): Item | undefined {
    const current = this.items.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch };
    this.items.set(id, next);
    return next;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }
}

export const store = new ItemStore([
  { title: 'Read Stage 1', status: 'done', ownerId: 'u_1' },
  { title: 'Write a router', status: 'doing', ownerId: 'u_1' },
]);
