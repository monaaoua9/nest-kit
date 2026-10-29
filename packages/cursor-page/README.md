# @nest-kit/cursor-page

Cursor pagination helpers that return `{ data, meta }`.

```ts
const rows = await db.post.findMany({ take: limit + 1, orderBy: { id: 'asc' } });
return toPage(rows, limit, r => ({ id: r.id }));
```

`decodeCursor` throws `invalid cursor` on bad input, map that to a 400 in your filter.
