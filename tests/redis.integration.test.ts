import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RedisIdemStore, createIdempotent } from '../packages/idempotency/src';
import {
  RedisCounterStore,
  RedisStore,
  createLimiter,
  createSlidingLimiter,
} from '../packages/rate-limit/src';

const url = process.env.REDIS_URL;

// only runs in CI (or locally with REDIS_URL set)
describe.skipIf(!url)('redis', () => {
  let redis: Redis;
  const id = () => Math.random().toString(36).slice(2);

  beforeAll(() => {
    redis = new Redis(url!);
  });
  afterAll(async () => {
    await redis.quit();
  });

  it('fixed window limiter counts and expires', async () => {
    const check = createLimiter({ limit: 2, windowMs: 300, store: new RedisStore(redis, `t:${id()}:`) });
    const k = id();
    expect((await check(k)).allowed).toBe(true);
    expect((await check(k)).allowed).toBe(true);
    expect((await check(k)).allowed).toBe(false);
    await new Promise(r => setTimeout(r, 350));
    expect((await check(k)).allowed).toBe(true);
  });

  it('sliding limiter blocks over the limit', async () => {
    const check = createSlidingLimiter({
      limit: 3,
      windowMs: 10_000,
      store: new RedisCounterStore(redis, `t:${id()}:`),
    });
    const k = id();
    const res = [];
    for (let i = 0; i < 5; i++) res.push((await check(k)).allowed);
    expect(res.filter(Boolean).length).toBeLessThanOrEqual(3);
    expect(res[4]).toBe(false);
  });

  it('idempotency executes once across two instances', async () => {
    const store = new RedisIdemStore(redis, `t:${id()}:`);
    const a = createIdempotent({ store });
    const b = createIdempotent({ store });
    let n = 0;
    const slow = async () => {
      n++;
      await new Promise(r => setTimeout(r, 100));
      return { ok: true };
    };
    const k = id();
    const [x, y] = await Promise.all([a(k, slow), b(k, slow)]);
    expect(x).toEqual({ ok: true });
    expect(y).toEqual({ ok: true });
    expect(n).toBe(1);
  });
});
