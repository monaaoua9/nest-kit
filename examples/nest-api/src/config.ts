import { createEnv } from '@monaaoua9/env';

const e = createEnv();

export const cfg = {
  port: e.int('PORT', 3000),
  otpSecret: e.str('OTP_SECRET', 'dev-only-secret'),
  dev: e.str('NODE_ENV', 'development') !== 'production',
};

e.done();
