export interface RetryOpts {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  shouldRetry?: (err: unknown) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(signal!.reason);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOpts = {},
): Promise<T> {
  const { retries = 3, baseMs = 200, maxMs = 5000, shouldRetry = () => true, onRetry, signal } = opts;

  for (let i = 0; ; i++) {
    if (signal?.aborted) throw signal.reason;
    try {
      return await fn(i);
    } catch (err) {
      if (i >= retries || !shouldRetry(err)) throw err;
      // full jitter
      const delay = Math.random() * Math.min(maxMs, baseMs * 2 ** i);
      onRetry?.(err, i + 1, delay);
      await sleep(delay, signal);
    }
  }
}
