export interface IdemStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  // optional: needed to dedupe across several server instances
  lock?(key: string, ttlMs: number): Promise<boolean>;
  unlock?(key: string): Promise<void>;
}

export class MemoryIdemStore implements IdemStore {
  private m = new Map<string, { v: string; exp: number }>();
  private locks = new Map<string, number>();

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

  async lock(key: string, ttlMs: number) {
    const exp = this.locks.get(key);
    if (exp && exp > Date.now()) return false;
    this.locks.set(key, Date.now() + ttlMs);
    return true;
  }

  async unlock(key: string) {
    this.locks.delete(key);
  }
}

// subset of ioredis
export interface RedisIdemClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'PX', ms: number, nx?: 'NX'): Promise<string | null>;
  del(key: string): Promise<unknown>;
}

export class RedisIdemStore implements IdemStore {
  constructor(private redis: RedisIdemClient, private prefix = 'idem:') {}

  async get(key: string) {
    return (await this.redis.get(`${this.prefix}${key}`)) ?? undefined;
  }

  async set(key: string, value: string, ttlMs: number) {
    await this.redis.set(`${this.prefix}${key}`, value, 'PX', ttlMs);
  }

  async lock(key: string, ttlMs: number) {
    const r = await this.redis.set(`${this.prefix}lock:${key}`, '1', 'PX', ttlMs, 'NX');
    return r === 'OK';
  }

  async unlock(key: string) {
    await this.redis.del(`${this.prefix}lock:${key}`);
  }
}

export interface IdempotentOpts {
  store?: IdemStore;
  ttlMs?: number;
  lockTtlMs?: number;
  waitMs?: number;
}

export function createIdempotent({
  store = new MemoryIdemStore(),
  ttlMs = 24 * 60 * 60 * 1000,
  lockTtlMs = 30_000,
  waitMs = 5000,
}: IdempotentOpts = {}) {
  const inflight = new Map<string, Promise<unknown>>();

  // another instance holds the lock, wait for its result to show up
  async function waitForResult(key: string) {
    const until = Date.now() + waitMs;
    while (Date.now() < until) {
      await new Promise(r => setTimeout(r, 25));
      const v = await store.get(key);
      if (v !== undefined) return v;
    }
    throw new Error('idempotency key is busy');
  }

  async function execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const locked = store.lock ? await store.lock(key, lockTtlMs) : true;
    if (!locked) return JSON.parse(await waitForResult(key)) as T;

    try {
      const res = await fn();
      await store.set(key, JSON.stringify(res), ttlMs);
      return res;
    } finally {
      await store.unlock?.(key);
    }
  }

  return async function run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = await store.get(key);
    if (cached !== undefined) return JSON.parse(cached) as T;

    // double tap on the same instance
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;

    const p = execute(key, fn).finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  };
}
