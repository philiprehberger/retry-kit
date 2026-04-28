# Changelog

## 0.3.0

- Add `retryUntil(fn, predicate, options)` for polling — reuses retry's backoff, jitter, signal, and total-timeout machinery
- Export `RetryUntilOptions` type

## 0.2.6

- Fix README GitHub URLs to use correct repo name (ts-retry-kit)

## 0.2.5

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.2.4

- Fix README badge configuration

## 0.2.3

- Add Development section to README
- Fix CI badge to reference publish.yml
- Add test script to package.json

## 0.2.0
- Add configurable `backoffMultiplier` option for exponential backoff strategy
- Add `halfOpenSuccessThreshold` option for circuit breaker half-open state
- Add `getState()` method to circuit breaker wrapper for inspecting current state
- Export `CircuitBreakerWrapper` type

## 0.1.0
- Initial release
