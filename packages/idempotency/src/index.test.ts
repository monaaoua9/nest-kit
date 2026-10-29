import { expect, it } from 'vitest';
import {
  IdempotencyBusyError,
  IdempotencyMismatchError,
  MemoryIdemStore,
  createIdempotent,
} from './index';

it('runs once per key and replays the result', async () => {
  const run = createIdempotent();
  let n = 0;
  const pay = async () => ({ id: ++n });

  expect(await run('k1', pay)).toEqual({ id: 1 });
  expect(await run('k1', pay)).toEqual({ id: 1 });
  expect(await run('k2', pay)).toEqual({ id: 2 });
});

it('concurrent calls share one execution', async () => {
  const run = createIdempotent();
  let n = 0;
  const slow = async () => {
    n++;
    await new Promise(r => setTimeout(r, 20));
    return 'done';
  };

  const out = await Promise.all([run('k', slow), run('k', slow), run('k', slow)]);
  expect(out).toEqual(['done', 'done', 'done']);
  expect(n).toBe(1);
});

it('does not cache failures', async () => {
  const run = createIdempotent();
  let n = 0;
  const flaky = async () => {
    if (++n === 1) throw new Error('boom');
    return 'ok';
  };

  await expect(run('k', flaky)).rejects.toThrow('boom');
  expect(await run('k', flaky)).toBe('ok');
});

it('expires after the ttl', async () => {
  const run = createIdempotent({ ttlMs: 10 });
  let n = 0;
  await run('k', async () => ++n);
  await new Promise(r => setTimeout(r, 25));
  expect(await run('k', async () => ++n)).toBe(2);
});

it('two instances sharing a store only execute once', async () => {
  const store = new MemoryIdemStore();
  const a = createIdempotent({ store });
  const b = createIdempotent({ store });
  let n = 0;
  const slow = async () => {
    n++;
    await new Promise(r => setTimeout(r, 60));
    return { paid: true };
  };

  const [x, y] = await Promise.all([a('k', slow), b('k', slow)]);
  expect(x).toEqual({ paid: true });
  expect(y).toEqual({ paid: true });
  expect(n).toBe(1);
});

it('releases the lock when fn fails', async () => {
  const store = new MemoryIdemStore();
  const run = createIdempotent({ store });
  await expect(run('k', async () => { throw new Error('x'); })).rejects.toThrow('x');
  expect(await run('k', async () => 'ok')).toBe('ok');
});

it('keeps the lock alive while a slow call runs', async () => {
  const store = new MemoryIdemStore();
  const a = createIdempotent({ store, lockTtlMs: 60 });
  const b = createIdempotent({ store, lockTtlMs: 60, waitMs: 2000 });
  let n = 0;
  const slow = async () => {
    n++;
    await new Promise(r => setTimeout(r, 250));
    return 'done';
  };

  const p1 = a('k', slow);
  await new Promise(r => setTimeout(r, 80)); // past the original ttl
  const p2 = b('k', slow);
  expect(await Promise.all([p1, p2])).toEqual(['done', 'done']);
  expect(n).toBe(1);
});

it('only the lock owner can release it', async () => {
  const store = new MemoryIdemStore();
  const token = await store.lock('k', 1000);
  expect(token).toBeTruthy();
  expect(await store.lock('k', 1000)).toBeNull();

  await store.unlock('k', 'someone-else');
  expect(await store.lock('k', 1000)).toBeNull();
  expect(await store.extend('k', 'someone-else', 1000)).toBe(false);

  await store.unlock('k', token!);
  expect(await store.lock('k', 1000)).toBeTruthy();
});

it('rejects the same key with a different fingerprint', async () => {
  const run = createIdempotent();
  await run('k', async () => ({ amount: 10 }), { fingerprint: 'a' });
  await expect(run('k', async () => ({ amount: 99 }), { fingerprint: 'b' })).rejects.toBeInstanceOf(
    IdempotencyMismatchError,
  );
  expect(await run('k', async () => ({ amount: 99 }), { fingerprint: 'a' })).toEqual({ amount: 10 });
});

it('times out as busy when the lock holder never finishes', async () => {
  const store = new MemoryIdemStore();
  await store.lock('k', 10_000);
  const run = createIdempotent({ store, waitMs: 100 });
  await expect(run('k', async () => 1)).rejects.toBeInstanceOf(IdempotencyBusyError);
});
