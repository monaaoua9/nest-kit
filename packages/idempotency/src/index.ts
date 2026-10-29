export interface IdemStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
}

export class MemoryIdemStore implements IdemStore {
  private m = new Map<string, { v: string; exp: number }>();

  async get(key: string) {
    const e = this.m.get(key);
    if (!e) return undefined;
    if (e.exp <= Date.now()) {
      this.m.delete(key);
      return undefined;
    }
    return e.v;
  }

  async set(key: string, v: string, ttlMs: number) {
    this.m.set(key, { v, exp: Date.now() + ttlMs });
  }
}

export function createIdempotent({
  store = new MemoryIdemStore(),
  ttlMs = 24 * 60 * 60 * 1000,
}: { store?: IdemStore; ttlMs?: number } = {}) {
  const inflight = new Map<string, Promise<unknown>>();

  return async function run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = await store.get(key);
    if (cached !== undefined) return JSON.parse(cached) as T;

    // double tap: same key while the first call is still running
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;

    const p = fn()
      .then(async res => {
        await store.set(key, JSON.stringify(res), ttlMs);
        return res;
      })
      .finally(() => inflight.delete(key));

    inflight.set(key, p);
    return p;
  };
}
