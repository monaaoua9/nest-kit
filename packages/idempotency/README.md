# @monaaoua9/idempotency

Run an operation once per idempotency key. Retried requests get the stored result back, concurrent duplicates share one execution, failures are not cached.

```ts
const once = createIdempotent({ store: myRedisStore, ttlMs: 60 * 60 * 1000 });

@Post('payments')
pay(@Headers('idempotency-key') key: string, @Body() dto: PayDto) {
  return once(key, () => this.payments.charge(dto));
}
```

Results are stored as JSON, so return plain data.

**Several instances.** The default in-memory store dedupes per process. `RedisIdemStore` takes a `SET NX` lock with an owner token, so only one instance runs the function and the others wait for its result (`waitMs`, default 5s, then `IdempotencyBusyError`). The lock is renewed every third of `lockTtlMs` while the function runs, and release or renewal only works for the owner (compare-and-delete in Lua), so a stalled worker cannot free a lock someone else took after it expired.

**Same key, different request.** Pass `{ fingerprint }` (e.g. the amount or a body hash). Reusing the key with another fingerprint throws `IdempotencyMismatchError`, map it to a 422.
