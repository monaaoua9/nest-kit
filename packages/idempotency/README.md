# @monaaoua9/idempotency

Run an operation once per idempotency key. Retried requests get the stored result back, concurrent duplicates share one execution, failures are not cached.

```ts
const once = createIdempotent({ store: myRedisStore, ttlMs: 60 * 60 * 1000 });

@Post('payments')
pay(@Headers('idempotency-key') key: string, @Body() dto: PayDto) {
  return once(key, () => this.payments.charge(dto));
}
```

Results are stored as JSON, so return plain data. With the default in-memory store dedupe is per process. For several instances use `RedisIdemStore`, it takes a `SET NX` lock so only one instance runs the function and the rest wait for its result (`waitMs`, default 5s).
