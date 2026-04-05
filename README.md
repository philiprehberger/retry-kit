# @philiprehberger/retry-kit

[![CI](https://github.com/philiprehberger/ts-retry-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-retry-kit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/retry-kit.svg)](https://www.npmjs.com/package/@philiprehberger/retry-kit)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-retry-kit)](https://github.com/philiprehberger/ts-retry-kit/commits/main)

Async retry with exponential backoff, circuit breaker, and abort signals

## Installation

```bash
npm install @philiprehberger/retry-kit
```

## Usage

### Basic Retry

```ts
import { retry } from '@philiprehberger/retry-kit';

const data = await retry(() => fetch('/api/data').then(r => r.json()), {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000,
});
```

### With Options

```ts
const result = await retry(() => fetch('/api/data'), {
  maxAttempts: 5,
  backoff: 'exponential',    // 'exponential' | 'linear' | 'fixed'
  backoffMultiplier: 2,      // base for exponential backoff (default: 2)
  initialDelay: 1000,
  maxDelay: 30000,
  jitter: true,
  timeout: 5000,             // per-attempt timeout
  totalTimeout: 30000,       // total timeout across all attempts
  signal: AbortSignal.timeout(60000),
  retryOn: (error) => error.status >= 500,
  onRetry: (error, attempt) => console.log(`Retry ${attempt}...`),
});
```

### Presets

```ts
import { retry, presets } from '@philiprehberger/retry-kit';

await retry(fn, presets.networkRequest);
await retry(fn, presets.databaseQuery);
await retry(fn, presets.aggressive);
await retry(fn, presets.gentle);
```

### Circuit Breaker

```ts
import { withCircuitBreaker } from '@philiprehberger/retry-kit';

const resilientFetch = withCircuitBreaker(fetch, {
  failureThreshold: 5,             // open after 5 failures
  resetTimeout: 30000,             // try again after 30s
  halfOpenSuccessThreshold: 2,     // require 2 successes in half-open before closing
  onStateChange: (from, to) => console.log(`Circuit: ${from} → ${to}`),
  onCircuitOpen: (failures) => console.warn(`Circuit opened after ${failures} failures`),
});

// Inspect current circuit state
console.log(resilientFetch.getState()); // 'closed' | 'open' | 'half-open'

try {
  await resilientFetch('/api/data');
} catch (error) {
  if (error.name === 'CircuitOpenError') {
    // Circuit is open, fail fast
  }
}
```

## API

| Export | Type | Description |
|--------|------|-------------|
| `retry(fn, options?)` | Function | Retry an async function with configurable backoff and abort support |
| `withCircuitBreaker(fn, options?)` | Function | Wrap a function with circuit breaker protection; returns callable with `.getState()` |
| `presets` | Object | Built-in retry option presets: `aggressive`, `gentle`, `networkRequest`, `databaseQuery` |
| `RetryError` | Class | Thrown when all retry attempts are exhausted |
| `CircuitOpenError` | Class | Thrown when circuit breaker is open |
| `RetryOptions` | Type | Options: `maxAttempts`, `backoff`, `initialDelay`, `maxDelay`, `jitter`, `timeout`, `totalTimeout`, `signal`, `retryOn`, `onRetry`, `onSuccess`, `onFailure` |
| `BackoffStrategy` | Type | `'exponential' \| 'linear' \| 'fixed'` |
| `CircuitBreakerOptions` | Type | Options: `failureThreshold`, `resetTimeout`, `halfOpenSuccessThreshold`, `onStateChange`, `onCircuitOpen` |
| `CircuitState` | Type | `'closed' \| 'open' \| 'half-open'` |

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-retry-kit)

🐛 [Report issues](https://github.com/philiprehberger/ts-retry-kit/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-retry-kit/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
