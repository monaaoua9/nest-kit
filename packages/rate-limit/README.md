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

Fixed window means a burst of 2x limit is possible across a window edge, see below for the sliding version.

## Sliding window

`createLimiter` is a fixed window. Use `createSlidingLimiter` when the edge burst matters:

```ts
const check = createSlidingLimiter({
  limit: 100,
  windowMs: 60_000,
  store: new RedisCounterStore(redis),
});
```

It weights the previous bucket by how much of it still overlaps the window, so 2x bursts across a boundary are rejected. Rejected calls still count.
