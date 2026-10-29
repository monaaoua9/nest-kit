# @nest-kit/circuit-breaker

Wrap a flaky async call. After `threshold` failures in a row it fails fast with `CircuitOpenError` until `cooldownMs` passes, then lets one probe through.

```ts
const transcribe = createBreaker(groq.transcribe, { threshold: 3, cooldownMs: 30_000 });

try {
  await transcribe(audio);
} catch (e) {
  if (e instanceof CircuitOpenError) return queueForLater(audio);
  throw e;
}
```

Works well on the outside of `retry`, not inside it.
