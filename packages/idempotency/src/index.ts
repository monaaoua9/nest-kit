import { randomUUID } from 'crypto';

export class IdempotencyMismatchError extends Error {
  constructor() {
    super('idempotency key reused with a different request');
  }
}

export class IdempotencyBusyError extends Error {
  constructor() {
    super('idempotency key is busy');
  }
}

export interface IdemStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  // optional, needed to dedupe across several server instances.
  // lock returns an owner token, only the owner can extend or release it
  lock?(key: string, ttlMs: number): Promise<string | null>;
  extend?(key: string, token: string, ttlMs: number): Promise<boolean>;
  unlock?(key: string, token: string): Promise<void>;
}

export class MemoryIdemStore implements IdemStore {
  private m = new Map<string, { v: string; exp: number }>();
  private locks = new Map<string, { token: string; exp: number }>();

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
    const l = this.locks.get(key);
    if (l && l.exp > Date.now()) return null;
    const token = randomUUID();
    this.locks.set(key, { token, exp: Date.now() + ttlMs });
    return token;
  }

  async extend(key: string, token: string, ttlMs: number) {
    const l = this.locks.get(key);
    if (!l || l.token !== token || l.exp <= Date.now()) return false;
    l.exp = Date.now() + ttlMs;
    return true;
  }

  async unlock(key: string, token: string) {
    if (this.locks.get(key)?.token === token) this.locks.delete(key);
  }
}

// subset of ioredis
export interface RedisIdemClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'PX', ms: number, nx?: 'NX'): Promise<string | null>;
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
}

// compare-and-act so a slow worker can never touch a lock that expired and was taken by someone else
const UNLOCK = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;
const EXTEND = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end`;

export class RedisIdemStore implements IdemStore {
  constructor(private redis: RedisIdemClient, private prefix = 'idem:') {}

  async get(key: string) {
    return (await this.redis.get(`${this.prefix}${key}`)) ?? undefined;
  }

  async set(key: string, value: string, ttlMs: number) {
    await this.redis.set(`${this.prefix}${key}`, value, 'PX', ttlMs);
  }

  async lock(key: string, ttlMs: number) {
    const token = randomUUID();
    const r = await this.redis.set(`${this.prefix}lock:${key}`, token, 'PX', ttlMs, 'NX');
    return r === 'OK' ? token : null;
  }

  async extend(key: string, token: string, ttlMs: number) {
    const r = await this.redis.eval(EXTEND, 1, `${this.prefix}lock:${key}`, token, ttlMs);
    return r === 1;
  }

  async unlock(key: string, token: string) {
    await this.redis.eval(UNLOCK, 1, `${this.prefix}lock:${key}`, token);
  }
}

export interface IdempotentOpts {
  store?: IdemStore;
  ttlMs?: number;
  lockTtlMs?: number;
  waitMs?: number;
}

interface Stored {
  fp?: string;
  v?: unknown;
}

export function createIdempotent({
  store = new MemoryIdemStore(),
  ttlMs = 24 * 60 * 60 * 1000,
  lockTtlMs = 30_000,
  waitMs = 5000,
}: IdempotentOpts = {}) {
  const inflight = new Map<string, Promise<unknown>>();

  function unpack(raw: string, fp?: string): Stored {
    const s: Stored = JSON.parse(raw);
    if (s.fp !== undefined && fp !== undefined && s.fp !== fp) throw new IdempotencyMismatchError();
    return s;
  }

  // another instance holds the lock, wait for its result to show up
  async function waitForResult(key: string, fp?: string) {
    const until = Date.now() + waitMs;
    while (Date.now() < until) {
      await new Promise(r => setTimeout(r, 25));
      const raw = await store.get(key);
      if (raw !== undefined) return unpack(raw, fp);
    }
    throw new IdempotencyBusyError();
  }

  async function execute<T>(key: string, fn: () => Promise<T>, fp?: string): Promise<T> {
    const token = store.lock ? await store.lock(key, lockTtlMs) : 'local';
    if (token === null) return (await waitForResult(key, fp)).v as T;

    // keep the lock alive while fn runs, otherwise a slow call could be executed twice
    const timer =
      store.extend && token !== 'local'
        ? setInterval(() => store.extend!(key, token, lockTtlMs).catch(() => {}), lockTtlMs / 3)
        : undefined;
    timer?.unref();

    try {
      const res = await fn();
      await store.set(key, JSON.stringify({ fp, v: res } satisfies Stored), ttlMs);
      return res;
    } finally {
      clearInterval(timer);
      if (token !== 'local') await store.unlock?.(key, token);
    }
  }

  // fingerprint: anything that identifies the request body, same key + other fingerprint is rejected
  return async function run<T>(
    key: string,
    fn: () => Promise<T>,
    opts: { fingerprint?: string } = {},
  ): Promise<T> {
    const raw = await store.get(key);
    if (raw !== undefined) return unpack(raw, opts.fingerprint).v as T;

    // double tap on the same instance
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;

    const p = execute(key, fn, opts.fingerprint).finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  };
}
