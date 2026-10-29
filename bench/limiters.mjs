// node bench/limiters.mjs  (run pnpm build first)
import { createLimiter, createSlidingLimiter } from '../packages/rate-limit/dist/index.js';
import { createBreaker } from '../packages/circuit-breaker/dist/index.js';
import { generateOtp, hashOtp, verifyOtp } from '../packages/otp/dist/index.js';
import { encodeCursor, decodeCursor } from '../packages/cursor-page/dist/index.js';

async function bench(name, n, fn) {
  for (let i = 0; i < 2000; i++) await fn(i); // warmup
  const t = process.hrtime.bigint();
  for (let i = 0; i < n; i++) await fn(i);
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  console.log(`${name.padEnd(28)} ${Math.round(n / (ms / 1000)).toLocaleString('en-US').padStart(12)} ops/s`);
}

const fixed = createLimiter({ limit: 1e9, windowMs: 60_000 });
const sliding = createSlidingLimiter({ limit: 1e9, windowMs: 60_000 });
const breaker = createBreaker(async () => 1);
const h = hashOtp('123456', 's');

await bench('fixed window (memory)', 300_000, i => fixed('k' + (i % 1000)));
await bench('sliding window (memory)', 300_000, i => sliding('k' + (i % 1000)));
await bench('circuit breaker closed', 300_000, () => breaker());
await bench('otp generate', 200_000, () => generateOtp());
await bench('otp verify', 100_000, () => verifyOtp('123456', h, 's'));
await bench('cursor encode+decode', 300_000, i => decodeCursor(encodeCursor({ id: i })));
