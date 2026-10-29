# @monaaoua9/env

Tiny typed env reader. No schema lib, no deps.

```ts
const e = createEnv();
export const cfg = {
  port: e.int('PORT', 3000),
  dbUrl: e.str('DATABASE_URL'),
  debug: e.bool('DEBUG', false),
};
e.done(); // throws once with every missing name
```

`list(name, def?)` splits a comma separated value, `oneOf(name, ["dev", "prod"], def?)` checks against a fixed set and narrows the type.
