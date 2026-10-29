export interface RateStore {
  hit(key: string, windowMs: number): Promise<{ count: number; resetMs: number }>;
}

export class MemoryStore implements RateStore {
  private m = new Map<string, { count: number; resetAt: number }>();

  async hit(key: string, windowMs: number) {
    const now = Date.now();
    if (this.m.size > 5000) this.sweep(now);

    let e = this.m.get(key);
    if (!e || e.resetAt <= now) {
      e = { count: 0, resetAt: now + windowMs };
      this.m.set(key, e);
    }
    e.count++;
    return { count: e.count, resetMs: e.resetAt - now };
  }

  private sweep(now: number) {
    for (const [k, e] of this.m) if (e.resetAt <= now) this.m.delete(k);
  }
}

// subset of ioredis, so you can pass the client as is
export interface RedisLike {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
  pttl(key: string): Promise<number>;
}

export class RedisStore implements RateStore {
  constructor(private redis: RedisLike, private prefix = 'rl:') {}

  async hit(key: string, windowMs: number) {
    const k = this.prefix + key;
    const count = await this.redis.incr(k);
    if (count === 1) await this.redis.pexpire(k, windowMs);

    let ttl = await this.redis.pttl(k);
    // key exists without expiry if we crashed between incr and pexpire
    if (ttl < 0) {
      await this.redis.pexpire(k, windowMs);
      ttl = windowMs;
    }
    return { count, resetMs: ttl };
  }
}

export interface LimiterOpts {
  limit: number;
  windowMs: number;
  store?: RateStore;
}

export function createLimiter({ limit, windowMs, store = new MemoryStore() }: LimiterOpts) {
  return async (key: string) => {
    const { count, resetMs } = await store.hit(key, windowMs);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetMs };
  };
}

export interface CounterStore {
  incr(key: string, ttlMs: number): Promise<number>;
  get(key: string): Promise<number>;
}

export class MemoryCounterStore implements CounterStore {
  private m = new Map<string, { n: number; exp: number }>();

  async incr(key: string, ttlMs: number) {
    const now = Date.now();
    const e = this.m.get(key);
    if (!e || e.exp <= now) {
      this.m.set(key, { n: 1, exp: now + ttlMs });
      return 1;
    }
    return ++e.n;
  }

  async get(key: string) {
    const e = this.m.get(key);
    return e && e.exp > Date.now() ? e.n : 0;
  }
}

export interface RedisCounterClient {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
}

export class RedisCounterStore implements CounterStore {
  constructor(private redis: RedisCounterClient, private prefix = 'rl:') {}

  async incr(key: string, ttlMs: number) {
    const k = this.prefix + key;
    const n = await this.redis.incr(k);
    if (n === 1) await this.redis.pexpire(k, ttlMs);
    return n;
  }

  async get(key: string) {
    return Number((await this.redis.get(this.prefix + key)) ?? 0);
  }
}

export interface SlidingOpts {
  limit: number;
  windowMs: number;
  store?: CounterStore;
}

// sliding window counter: previous bucket is weighted by how much of it still overlaps.
// rejected calls are counted too, so hammering keeps you blocked
export function createSlidingLimiter({ limit, windowMs, store = new MemoryCounterStore() }: SlidingOpts) {
  return async (key: string) => {
    const t = Date.now();
    const bucket = Math.floor(t / windowMs);
    const elapsed = (t % windowMs) / windowMs;

    const prev = await store.get(`${key}:${bucket - 1}`);
    const cur = await store.incr(`${key}:${bucket}`, windowMs * 2);
    const used = prev * (1 - elapsed) + cur;

    return {
      allowed: used <= limit,
      remaining: Math.max(0, Math.floor(limit - used)),
      resetMs: windowMs - (t % windowMs),
    };
  };
}
