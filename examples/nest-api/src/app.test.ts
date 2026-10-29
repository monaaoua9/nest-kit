import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('nest-api', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(() => app.close());

  const post = (url: string, payload: object, headers: Record<string, string> = {}) =>
    app.inject({ method: 'POST', url, payload, headers });

  describe('otp', () => {
    it('request then verify works, arabic digits accepted', async () => {
      const r = await post('/api/v1/otp/request', { phone: '٠٧٧٠١١١١١١١' });
      const { devCode } = r.json().data;

      const v = await post('/api/v1/otp/verify', { phone: '07701111111', code: devCode });
      expect(v.statusCode).toBe(201);
      expect(v.json()).toEqual({ data: { verified: true } });
    });

    it('wrong code gives a stable error code', async () => {
      await post('/api/v1/otp/request', { phone: '07702222222' });
      const v = await post('/api/v1/otp/verify', { phone: '07702222222', code: '000000x' });
      expect(v.statusCode).toBe(400);
      expect(v.json()).toEqual({ error: { code: 'INVALID_OTP', message: 'INVALID_OTP' } });
    });

    it('rate limits the 4th request in a minute', async () => {
      const codes: number[] = [];
      for (let i = 0; i < 4; i++) {
        codes.push((await post('/api/v1/otp/request', { phone: '07703333333' })).statusCode);
      }
      expect(codes).toEqual([201, 201, 201, 429]);
    });
  });

  describe('posts', () => {
    it('pages through with cursors', async () => {
      const first = (await app.inject({ url: '/api/v1/posts?limit=10' })).json();
      expect(first.data).toHaveLength(10);
      expect(first.meta.hasMore).toBe(true);

      const second = (
        await app.inject({ url: `/api/v1/posts?limit=10&cursor=${first.meta.nextCursor}` })
      ).json();
      expect(second.data[0].id).toBe(11);

      const last = (
        await app.inject({ url: `/api/v1/posts?limit=10&cursor=${second.meta.nextCursor}` })
      ).json();
      expect(last.data).toHaveLength(5);
      expect(last.meta).toEqual({ nextCursor: null, hasMore: false });
    });

    it('rejects a broken cursor', async () => {
      const r = await app.inject({ url: '/api/v1/posts?cursor=%25%25' });
      expect(r.statusCode).toBe(400);
      expect(r.json().error.code).toBe('INVALID_CURSOR');
    });
  });

  describe('payments', () => {
    it('same idempotency key returns the same charge', async () => {
      const h = { 'idempotency-key': 'abc-1' };
      const a = (await post('/api/v1/payments', { amount: 50 }, h)).json();
      const b = (await post('/api/v1/payments', { amount: 50 }, h)).json();
      expect(b).toEqual(a);

      const c = (await post('/api/v1/payments', { amount: 50 }, { 'idempotency-key': 'abc-2' })).json();
      expect(c.data.chargeId).toBe(a.data.chargeId + 1);
    });

    it('same key with another amount is rejected', async () => {
      const h = { 'idempotency-key': 'abc-3' };
      await post('/api/v1/payments', { amount: 10 }, h);
      const r = await post('/api/v1/payments', { amount: 999 }, h);
      expect(r.statusCode).toBe(422);
      expect(r.json().error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    });

    it('requires the header', async () => {
      const r = await post('/api/v1/payments', { amount: 5 });
      expect(r.json().error.code).toBe('MISSING_IDEMPOTENCY_KEY');
    });
  });
});
