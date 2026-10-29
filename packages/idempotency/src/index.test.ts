import { expect, it } from 'vitest';
import { createIdempotent } from './index';

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
