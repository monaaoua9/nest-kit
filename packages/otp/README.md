# @monaaoua9/otp

Numeric OTP generation (crypto RNG) and HMAC hash/verify with constant-time compare.

```ts
const code = generateOtp();
await redis.set(key, hashOtp(code, secret), 'EX', 300);
// later
verifyOtp(input, stored, secret);
```

Rate-limit attempts yourself, this only handles the code.
