# Security

If you find a vulnerability, please open a private security advisory on this repo (Security tab, "Report a vulnerability") instead of a public issue.

Notes on what the packages do and don't cover:

- `otp` uses `crypto.randomInt` and an HMAC with a server side secret, compared in constant time. It does not rate limit attempts, pair it with `rate-limit`.
- `idempotency` stores results as JSON for `ttlMs`. Don't use a guessable key for sensitive operations, scope it to the user.
