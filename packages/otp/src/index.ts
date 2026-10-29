import { createHmac, randomInt, timingSafeEqual } from 'crypto';

export function generateOtp(len = 6): string {
  return String(randomInt(0, 10 ** len)).padStart(len, '0');
}

// keyed hash on purpose: a plain hash of 6 digits is brute-forced instantly
export function hashOtp(code: string, secret: string): string {
  return createHmac('sha256', secret).update(code).digest('hex');
}

export function verifyOtp(code: string, hash: string, secret: string): boolean {
  const a = Buffer.from(hashOtp(code, secret));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
