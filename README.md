# nest-kit

[![ci](https://github.com/monaaoua9/nest-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/monaaoua9/nest-kit/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-blue)
![typescript](https://img.shields.io/badge/TypeScript-strict-3178c6)

Nine small TypeScript packages for NestJS backends. Zero runtime dependencies, each one tested and typed.

| package | what it does |
|---|---|
| [`cursor-page`](packages/cursor-page) | cursor pagination, `{ data, meta }` responses |
| [`app-error`](packages/app-error) | stable string error codes + `{ error: { code, message } }` |
| [`retry`](packages/retry) | async retry, exponential backoff with jitter |
| [`otp`](packages/otp) | OTP generate / hash / verify (HMAC, constant-time compare) |
| [`env`](packages/env) | typed env reader that reports every missing var at once |
| [`rate-limit`](packages/rate-limit) | fixed and sliding window limiters, in-memory or Redis store |
| [`circuit-breaker`](packages/circuit-breaker) | fail fast on a dead dependency, half-open probe |
| [`idempotency`](packages/idempotency) | run once per key, replay result, dedupe across instances with a Redis lock |
| [`arabic-text`](packages/arabic-text) | strip tashkeel, convert digits, normalize for search |

## Example

```ts
import { toPage } from '@monaaoua9/cursor-page';
import { AppError } from '@monaaoua9/app-error';
import { generateOtp, hashOtp } from '@monaaoua9/otp';

const rows = await db.post.findMany({ take: limit + 1, orderBy: { id: 'asc' } });
return toPage(rows, limit, r => ({ id: r.id }));

if (!user) throw AppError.notFound('USER_NOT_FOUND');
```

## Layout

pnpm workspace, one folder per package under `packages/`. Tests are vitest, versioning is changesets. CI starts a real Redis and runs the Redis stores against it, then typecheck, build and all tests.

## Dev

```
pnpm install
pnpm test
pnpm build
```

## License

MIT
