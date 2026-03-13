import type { CircuitBreakerOptions, CircuitState } from './types.js';
import { CircuitOpenError } from './types.js';

export interface CircuitBreakerWrapper<TArgs extends unknown[], TReturn> {
  (...args: TArgs): Promise<TReturn>;
  getState(): CircuitState;
}

export function withCircuitBreaker<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: CircuitBreakerOptions = {},
): CircuitBreakerWrapper<TArgs, TReturn> {
  const {
    failureThreshold = 5,
    resetTimeout = 30000,
    halfOpenMaxAttempts = 1,
    halfOpenSuccessThreshold = 1,
    onStateChange,
    onCircuitOpen,
  } = options;

  let state: CircuitState = 'closed';
  let failures = 0;
  let lastFailureTime = 0;
  let halfOpenAttempts = 0;
  let halfOpenSuccesses = 0;

  function transition(to: CircuitState): void {
    if (state !== to) {
      const from = state;
      state = to;
      onStateChange?.(from, to);
    }
  }

  const wrapper = async (...args: TArgs): Promise<TReturn> => {
    if (state === 'open') {
      if (Date.now() - lastFailureTime >= resetTimeout) {
        transition('half-open');
        halfOpenAttempts = 0;
        halfOpenSuccesses = 0;
      } else {
        throw new CircuitOpenError();
      }
    }

    if (state === 'half-open' && halfOpenAttempts >= halfOpenMaxAttempts) {
      throw new CircuitOpenError();
    }

    try {
      if (state === 'half-open') {
        halfOpenAttempts++;
      }

      const result = await fn(...args);

      if (state === 'half-open') {
        halfOpenSuccesses++;
        if (halfOpenSuccesses >= halfOpenSuccessThreshold) {
          transition('closed');
        }
      }
      failures = 0;

      return result;
    } catch (error) {
      failures++;
      lastFailureTime = Date.now();
      halfOpenSuccesses = 0;

      if (state === 'half-open') {
        transition('open');
        onCircuitOpen?.(failures);
      } else if (failures >= failureThreshold) {
        transition('open');
        onCircuitOpen?.(failures);
      }

      throw error;
    }
  };

  wrapper.getState = (): CircuitState => state;

  return wrapper as CircuitBreakerWrapper<TArgs, TReturn>;
}
