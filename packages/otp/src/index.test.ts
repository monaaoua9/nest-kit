import { expect, it } from 'vitest';
import { generateOtp, hashOtp, verifyOtp } from './index';

it('generates digits only, right length', () => {
  for (let i = 0; i < 200; i++) expect(generateOtp(6)).toMatch(/^\d{6}$/);
  expect(generateOtp(4)).toHaveLength(4);
});

it('verifies the right code only', () => {
  const h = hashOtp('123456', 's3cret');
  expect(verifyOtp('123456', h, 's3cret')).toBe(true);
  expect(verifyOtp('123457', h, 's3cret')).toBe(false);
  expect(verifyOtp('123456', h, 'other')).toBe(false);
});

it('does not throw on a malformed hash', () => {
  expect(verifyOtp('123456', 'abc', 's3cret')).toBe(false);
});
