export class CircuitOpenError extends Error {
  constructor() {
    super('circuit open');
  }
}

export interface BreakerOpts {
  threshold?: number;
  cooldownMs?: number;
  now?: () => number;
}

export function createBreaker<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  { threshold = 5, cooldownMs = 10_000, now = Date.now }: BreakerOpts = {},
) {
  let failures = 0;
  let openedAt: number | null = null;
  let probing = false;

  const state = () => {
    if (openedAt === null) return 'closed';
    return now() - openedAt >= cooldownMs ? 'half-open' : 'open';
  };

  async function call(...args: A): Promise<R> {
    const s = state();
    if (s === 'open') throw new CircuitOpenError();
    if (s === 'half-open') {
      // only one probe at a time
      if (probing) throw new CircuitOpenError();
      probing = true;
    }

    try {
      const out = await fn(...args);
      failures = 0;
      openedAt = null;
      return out;
    } catch (err) {
      failures++;
      if (s === 'half-open' || failures >= threshold) openedAt = now();
      throw err;
    } finally {
      if (s === 'half-open') probing = false;
    }
  }

  call.state = state;
  return call;
}
