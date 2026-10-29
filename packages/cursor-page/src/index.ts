export interface Page<T> {
  data: T[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

export function encodeCursor(v: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(v)).toString('base64url');
}

export function decodeCursor<T = Record<string, unknown>>(cursor: string): T {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new Error('invalid cursor');
  }
}

// query with take: limit + 1, pass the rows straight in
export function toPage<T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => Record<string, unknown>,
): Page<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  return {
    data,
    meta: { nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null, hasMore },
  };
}
