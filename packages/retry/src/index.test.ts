import { expect, it } from 'vitest';
import { retry } from './index';

it('retries until it works', async () => {
  let calls = 0;
  const out = await retry(async () => {
    if (++calls < 3) throw new Error('nope');
    return 'ok';
  }, { baseMs: 1 });
  expect(out).toBe('ok');
  expect(calls).toBe(3);
});

it('gives up after the limit', async () => {
  let calls = 0;
  await expect(
    retry(async () => { calls++; throw new Error('x'); }, { retries: 2, baseMs: 1 }),
  ).rejects.toThrow('x');
  expect(calls).toBe(3);
});

it('stops when shouldRetry says no', async () => {
  let calls = 0;
  await expect(
    retry(async () => { calls++; throw new Error('fatal'); }, { shouldRetry: () => false }),
  ).rejects.toThrow('fatal');
  expect(calls).toBe(1);
});
