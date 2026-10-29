# @nest-kit/app-error

Error with a stable string code and an HTTP status, plus the `{ error: { code, message } }` body shape.

```ts
throw new AppError('INVALID_OTP');
throw AppError.notFound('USER_NOT_FOUND');
```

Clients map `code` to their own text, the message is only for logs.
