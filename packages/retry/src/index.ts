export interface RetryOpts {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  shouldRetry?: (err: unknown) => boolean;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOpts = {},
): Promise<T> {
  const { retries = 3, baseMs = 200, maxMs = 5000, shouldRetry = () => true } = opts;

  for (let i = 0; ; i++) {
    try {
      return await fn(i);
    } catch (err) {
      if (i >= retries || !shouldRetry(err)) throw err;
      // full jitter
      await sleep(Math.random() * Math.min(maxMs, baseMs * 2 ** i));
    }
  }
}
