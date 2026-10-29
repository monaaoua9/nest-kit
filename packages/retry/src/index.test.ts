import { expect, it, vi } from 'vitest';
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

it('calls onRetry with attempt number and a delay within the cap', async () => {
  const seen: { attempt: number; delay: number }[] = [];
  await retry(
    async i => {
      if (i < 2) throw new Error('x');
      return 1;
    },
    { baseMs: 10, maxMs: 15, onRetry: (_e, attempt, delay) => seen.push({ attempt, delay }) },
  );
  expect(seen.map(s => s.attempt)).toEqual([1, 2]);
  for (const s of seen) expect(s.delay).toBeLessThanOrEqual(15);
});

it("aborts while waiting between attempts", async () => {
  vi.spyOn(Math, "random").mockReturnValue(1); // longest possible wait, no flakiness
  const ac = new AbortController();
  let calls = 0;
  const p = retry(async () => { calls++; throw new Error("x"); }, { baseMs: 5000, maxMs: 5000, signal: ac.signal });
  setTimeout(() => ac.abort(new Error("cancelled")), 20);
  await expect(p).rejects.toThrow("cancelled");
  expect(calls).toBe(1);
  vi.restoreAllMocks();
});

it('does not start when already aborted', async () => {
  const ac = new AbortController();
  ac.abort(new Error('nope'));
  let calls = 0;
  await expect(retry(async () => { calls++; return 1; }, { signal: ac.signal })).rejects.toThrow('nope');
  expect(calls).toBe(0);
});
