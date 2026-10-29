# @nest-kit/idempotency

Run an operation once per idempotency key. Retried requests get the stored result back, concurrent duplicates share one execution, failures are not cached.

```ts
const once = createIdempotent({ store: myRedisStore, ttlMs: 60 * 60 * 1000 });

@Post('payments')
pay(@Headers('idempotency-key') key: string, @Body() dto: PayDto) {
  return once(key, () => this.payments.charge(dto));
}
```

Results are stored as JSON, so return plain data. The in-flight dedupe is per process, use a store with atomic set-if-absent if you run several instances.
