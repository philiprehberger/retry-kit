import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { retryUntil, RetryError } from '../../dist/index.js';

describe('retryUntil', () => {
  it('returns when the predicate matches', async () => {
    let n = 0;
    const result = await retryUntil(
      () => ++n,
      (v) => v >= 3,
      { initialDelay: 1, maxAttempts: 5, jitter: false },
    );
    assert.equal(result, 3);
    assert.equal(n, 3);
  });

  it('throws RetryError when predicate is never satisfied', async () => {
    await assert.rejects(
      () => retryUntil(
        () => 'never',
        (v) => v === 'done',
        { initialDelay: 1, maxAttempts: 3, jitter: false },
      ),
      (err: unknown) => err instanceof RetryError && (err as RetryError).attempts === 3,
    );
  });

  it('honors custom failure message', async () => {
    await assert.rejects(
      () => retryUntil(
        () => 0,
        (v) => v > 0,
        { initialDelay: 1, maxAttempts: 2, failureMessage: 'gave up', jitter: false },
      ),
      /gave up/,
    );
  });

  it('propagates real errors thrown by fn', async () => {
    await assert.rejects(
      () => retryUntil<number>(
        () => { throw new Error('network down'); },
        (v) => v > 0,
        { initialDelay: 1, maxAttempts: 2, jitter: false, retryOn: () => false },
      ),
      /network down/,
    );
  });
});
