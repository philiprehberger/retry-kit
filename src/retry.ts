import type { RetryOptions, BackoffStrategy } from './types.js';
import { RetryError } from './types.js';

function calculateDelay(
  attempt: number,
  strategy: BackoffStrategy,
  initialDelay: number,
  maxDelay: number,
  jitter: boolean,
  backoffMultiplier: number,
): number {
  let delay: number;
  switch (strategy) {
    case 'exponential':
      delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
      break;
    case 'linear':
      delay = initialDelay * attempt;
      break;
    case 'fixed':
    default:
      delay = initialDelay;
      break;
  }

  delay = Math.min(delay, maxDelay);

  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.round(delay);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export async function retry<T>(
  fn: () => T | Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    backoff = 'exponential',
    backoffMultiplier = 2,
    initialDelay = 1000,
    maxDelay = 30000,
    jitter = true,
    timeout,
    totalTimeout,
    signal,
    retryOn,
    onRetry,
    onSuccess,
    onFailure,
  } = options;

  let totalController: AbortController | undefined;
  let totalTimer: ReturnType<typeof setTimeout> | undefined;

  if (totalTimeout) {
    totalController = new AbortController();
    totalTimer = setTimeout(() => totalController!.abort(new Error('Total timeout exceeded')), totalTimeout);
  }

  const effectiveSignal = totalController
    ? (signal ? mergeSignals(signal, totalController.signal) : totalController.signal)
    : signal;

  let lastError: unknown;

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (effectiveSignal?.aborted) {
          throw effectiveSignal.reason ?? new DOMException('Aborted', 'AbortError');
        }

        let result: T;
        if (timeout) {
          result = await Promise.race([
            Promise.resolve(fn()),
            sleep(timeout, effectiveSignal).then(() => {
              throw new Error(`Attempt ${attempt} timed out after ${timeout}ms`);
            }),
          ]);
        } else {
          result = await fn();
        }

        onSuccess?.(result, attempt);
        return result;
      } catch (error) {
        lastError = error;

        if (effectiveSignal?.aborted) {
          throw error;
        }

        if (retryOn && !retryOn(error)) {
          throw error;
        }

        if (attempt < maxAttempts) {
          onRetry?.(error, attempt);
          const delay = calculateDelay(attempt, backoff, initialDelay, maxDelay, jitter, backoffMultiplier);
          await sleep(delay, effectiveSignal);
        }
      }
    }
  } finally {
    if (totalTimer) clearTimeout(totalTimer);
  }

  onFailure?.(lastError, maxAttempts);
  throw new RetryError(
    `All ${maxAttempts} attempts failed`,
    maxAttempts,
    lastError,
  );
}

function mergeSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
