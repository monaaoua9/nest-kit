# @monaaoua9/rate-limit

Fixed-window rate limiter with a pluggable store. In-memory by default, Redis store takes any ioredis-like client.

```ts
const check = createLimiter({
  limit: 5,
  windowMs: 60_000,
  store: new RedisStore(redis),
});

const { allowed, resetMs } = await check(`otp:${phone}`);
if (!allowed) throw new AppError('TOO_MANY_REQUESTS', 429);
```

Fixed window means a burst of 2x limit is possible across a window edge. Fine for OTP and login throttling, not for strict API quotas.
