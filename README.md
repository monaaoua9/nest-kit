# nest-kit

Small TypeScript packages I keep rewriting for NestJS backends. Zero runtime dependencies.

| package | what it does |
|---|---|
| [`cursor-page`](packages/cursor-page) | cursor pagination, `{ data, meta }` responses |
| [`app-error`](packages/app-error) | stable string error codes + `{ error: { code, message } }` |
| [`retry`](packages/retry) | async retry, exponential backoff with jitter |
| [`otp`](packages/otp) | OTP generate / hash / verify |
| [`env`](packages/env) | typed env reader that reports all missing vars |

## Dev

```
pnpm install
pnpm test
pnpm build
```

MIT
