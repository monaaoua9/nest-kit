import { expect, it } from 'vitest';
import { MemoryIdemStore, createIdempotent } from './index';

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
