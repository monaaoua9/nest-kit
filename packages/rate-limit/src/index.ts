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
