import { expect, it } from 'vitest';
import { AppError, toErrorBody } from './index';

it('defaults message to the code', () => {
  const e = new AppError('INVALID_OTP');
  expect(e.status).toBe(400);
  expect(toErrorBody(e)).toEqual({ error: { code: 'INVALID_OTP', message: 'INVALID_OTP' } });
});

it('shortcuts set the status', () => {
  expect(AppError.notFound().status).toBe(404);
  expect(AppError.conflict('EMAIL_TAKEN').code).toBe('EMAIL_TAKEN');
});
