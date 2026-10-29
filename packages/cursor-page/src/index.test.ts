import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, toPage } from './index';

describe('cursor-page', () => {
  it('roundtrips a cursor', () => {
    const c = encodeCursor({ id: 'a1', at: 5 });
    expect(decodeCursor(c)).toEqual({ id: 'a1', at: 5 });
  });

  it('throws on garbage', () => {
    expect(() => decodeCursor('%%%')).toThrow('invalid cursor');
  });

  it('trims the extra row and sets nextCursor', () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const p = toPage(rows, 2, r => ({ id: r.id }));
    expect(p.data).toHaveLength(2);
    expect(p.meta.hasMore).toBe(true);
    expect(decodeCursor(p.meta.nextCursor!)).toEqual({ id: 2 });
  });

  it('last page has no cursor', () => {
    const p = toPage([{ id: 1 }], 2, r => ({ id: r.id }));
    expect(p.meta).toEqual({ nextCursor: null, hasMore: false });
  });
});
