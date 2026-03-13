export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';

export interface RetryOptions {
  maxAttempts?: number;
  backoff?: BackoffStrategy;
  backoffMultiplier?: number;
  initialDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  timeout?: number;
  totalTimeout?: number;
  signal?: AbortSignal;
  retryOn?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
  onSuccess?: (result: unknown, attempt: number) => void;
  onFailure?: (error: unknown, attempts: number) => void;
}

export interface RetryPreset extends RetryOptions {
  name: string;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  halfOpenMaxAttempts?: number;
  halfOpenSuccessThreshold?: number;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onCircuitOpen?: (failures: number) => void;
}

export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: unknown;

  constructor(message: string, attempts: number, lastError: unknown) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is open — request rejected');
    this.name = 'CircuitOpenError';
  }
}
