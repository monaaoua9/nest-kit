import { expect, it } from 'vitest';
import { CircuitOpenError, createBreaker } from './index';

function setup(threshold = 2) {
  let t = 0;
  let fail = true;
  let calls = 0;
  const b = createBreaker(
    async () => {
      calls++;
      if (fail) throw new Error('down');
      return 'ok';
    },
    { threshold, cooldownMs: 1000, now: () => t },
  );
  return { b, calls: () => calls, tick: (ms: number) => (t += ms), heal: () => (fail = false) };
}

it('opens after the threshold and stops calling through', async () => {
  const s = setup();
  await expect(s.b()).rejects.toThrow('down');
  await expect(s.b()).rejects.toThrow('down');
  expect(s.b.state()).toBe('open');
  await expect(s.b()).rejects.toBeInstanceOf(CircuitOpenError);
  expect(s.calls()).toBe(2);
});

it('closes again when the probe succeeds', async () => {
  const s = setup();
  await s.b().catch(() => {});
  await s.b().catch(() => {});
  s.tick(1000);
  expect(s.b.state()).toBe('half-open');
  s.heal();
  expect(await s.b()).toBe('ok');
  expect(s.b.state()).toBe('closed');
});

it('reopens immediately when the probe fails', async () => {
  const s = setup();
  await s.b().catch(() => {});
  await s.b().catch(() => {});
  s.tick(1000);
  await s.b().catch(() => {});
  expect(s.b.state()).toBe('open');
});

it('a success resets the failure count', async () => {
  let n = 0;
  const b = createBreaker(async () => {
    if (++n === 2) return 'ok';
    throw new Error('x');
  }, { threshold: 2 });
  await b().catch(() => {});
  await b();
  await b().catch(() => {});
  expect(b.state()).toBe('closed');
});
