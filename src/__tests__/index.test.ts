import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../../dist/index.js');

describe('retry-kit', () => {
  it('should export retry', () => {
    assert.ok(mod.retry);
  });

  it('should export withCircuitBreaker', () => {
    assert.ok(mod.withCircuitBreaker);
  });

  it('should export presets', () => {
    assert.ok(mod.presets);
  });

  it('should export RetryError', () => {
    assert.ok(mod.RetryError);
  });

  it('should export CircuitOpenError', () => {
    assert.ok(mod.CircuitOpenError);
  });
});
