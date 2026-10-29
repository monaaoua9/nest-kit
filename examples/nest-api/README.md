# nest-api example

A small NestJS + Fastify app that uses the packages the way a real backend would.

| route | uses |
|---|---|
| `POST /api/v1/otp/request` | `otp`, `rate-limit` (sliding window, 3/min per phone), `arabic-text` for phone digits |
| `POST /api/v1/otp/verify` | `otp`, `app-error` |
| `GET /api/v1/posts?limit&cursor` | `cursor-page` |
| `POST /api/v1/payments` | `idempotency` (needs an `Idempotency-Key` header) |

Config comes from `env` (`PORT`, `OTP_SECRET`, `NODE_ENV`) and every error goes out as `{ error: { code, message } }` through one filter.

```
pnpm build
pnpm --filter nest-api-example start
```

Tests are in `src/app.test.ts` and run with the rest (`pnpm test`).
Everything is in memory on purpose. Swap in `RedisCounterStore` and `RedisIdemStore` for more than one instance.
