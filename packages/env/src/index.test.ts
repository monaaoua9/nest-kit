import { expect, it } from 'vitest';
import { createEnv } from './index';

it('reads typed values and defaults', () => {
  const e = createEnv({ PORT: '8080', DEBUG: 'true' });
  expect(e.int('PORT', 3000)).toBe(8080);
  expect(e.int('OTHER', 3000)).toBe(3000);
  expect(e.bool('DEBUG', false)).toBe(true);
  expect(e.bool('QUIET', false)).toBe(false);
  expect(() => e.done()).not.toThrow();
});

it('lists every missing var at once', () => {
  const e = createEnv({});
  e.str('DATABASE_URL');
  e.str('REDIS_URL');
  expect(() => e.done()).toThrow('missing env: DATABASE_URL, REDIS_URL');
});

it('rejects non-integers', () => {
  expect(() => createEnv({ PORT: 'abc' }).int('PORT')).toThrow('PORT must be an integer');
});
