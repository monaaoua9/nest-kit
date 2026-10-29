# Contributing

```
pnpm install
pnpm build
pnpm coverage
```

- One package per folder in `packages/`, no runtime dependencies.
- Add tests next to the code, coverage thresholds are enforced in CI.
- Redis tests in `tests/` run when `REDIS_URL` is set, CI does it for you.
- Run `pnpm changeset` for anything that changes a package's behaviour.
