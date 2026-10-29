# @monaaoua9/retry

Retry an async call with exponential backoff and full jitter.

```ts
const res = await retry(() => fetch(url), {
  retries: 4,
  shouldRetry: e => !(e instanceof BadRequest),
});
```

Defaults: 3 retries, 200ms base, 5s cap.

`onRetry(err, attempt, delayMs)` is called before each wait, handy for logging. Pass `signal` to cancel: it stops the wait and no further attempt starts, the abort reason is thrown.
