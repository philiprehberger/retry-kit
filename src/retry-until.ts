import type { RetryOptions } from './types.js';
import { RetryError } from './types.js';
import { retry } from './retry.js';

export interface RetryUntilOptions<T> extends RetryOptions {
  /** Custom error message when the predicate never matches. */
  failureMessage?: string;
  /** Override max attempts for the polling loop (defaults to options.maxAttempts ?? 10). */
  maxPolls?: number;
}

class PredicateNotMetError extends Error {
  constructor(public readonly lastValue: unknown) {
    super('Predicate not met');
    this.name = 'PredicateNotMetError';
  }
}

/**
 * Polls `fn` until `predicate(result)` returns `true`, otherwise retries with the
 * same backoff/jitter machinery as `retry`. Throws `RetryError` if the predicate
 * is never satisfied within the attempt budget.
 */
export async function retryUntil<T>(
  fn: () => T | Promise<T>,
  predicate: (value: T) => boolean,
  options: RetryUntilOptions<T> = {},
): Promise<T> {
  const { failureMessage, maxPolls, ...retryOpts } = options;
  const maxAttempts = maxPolls ?? retryOpts.maxAttempts ?? 10;

  try {
    return await retry(async () => {
      const value = await fn();
      if (!predicate(value)) {
        throw new PredicateNotMetError(value);
      }
      return value;
    }, {
      ...retryOpts,
      maxAttempts,
      retryOn: (err) => {
        if (err instanceof PredicateNotMetError) return true;
        return retryOpts.retryOn ? retryOpts.retryOn(err) : true;
      },
    });
  } catch (err) {
    if (err instanceof RetryError && err.lastError instanceof PredicateNotMetError) {
      throw new RetryError(
        failureMessage ?? `Predicate not satisfied after ${maxAttempts} polls`,
        maxAttempts,
        err.lastError.lastValue,
      );
    }
    throw err;
  }
}
