import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisStore, createLimiter } from './index';

describe('rate-limit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('blocks after the limit and reports remaining', async () => {
    const check = createLimiter({ limit: 2, windowMs: 1000 });
    expect((await check('ip1')).remaining).toBe(1);
    expect((await check('ip1')).allowed).toBe(true);
    const third = await check('ip1');
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('keys are independent', async () => {
    const check = createLimiter({ limit: 1, windowMs: 1000 });
    await check('a');
    expect((await check('b')).allowed).toBe(true);
  });

  it('resets after the window', async () => {
    const check = createLimiter({ limit: 1, windowMs: 1000 });
    await check('a');
    expect((await check('a')).allowed).toBe(false);
    vi.advanceTimersByTime(1001);
    expect((await check('a')).allowed).toBe(true);
  });

  it('redis store sets expiry on first hit only', async () => {
    const calls: string[] = [];
    let n = 0;
    const fake = {
      incr: async () => ++n,
      pexpire: async () => { calls.push('pexpire'); },
      pttl: async () => 900,
    };
    const store = new RedisStore(fake);
    await store.hit('k', 1000);
    await store.hit('k', 1000);
    expect(calls).toEqual(['pexpire']);
  });

  it('redis store repairs a key with no ttl', async () => {
    const calls: string[] = [];
    const fake = {
      incr: async () => 5,
      pexpire: async () => { calls.push('pexpire'); },
      pttl: async () => -1,
    };
    const r = await new RedisStore(fake).hit('k', 1000);
    expect(calls).toEqual(['pexpire']);
    expect(r.resetMs).toBe(1000);
  });
});
