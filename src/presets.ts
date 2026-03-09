import type { RetryOptions } from './types.js';

export const presets = {
  aggressive: {
    maxAttempts: 5,
    backoff: 'exponential',
    initialDelay: 500,
    maxDelay: 5000,
    jitter: true,
  },
  gentle: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 2000,
    maxDelay: 30000,
    jitter: true,
  },
  networkRequest: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    jitter: true,
    timeout: 15000,
  },
  databaseQuery: {
    maxAttempts: 3,
    backoff: 'linear',
    initialDelay: 500,
    maxDelay: 5000,
    jitter: false,
    timeout: 10000,
  },
} as const satisfies Record<string, RetryOptions>;
