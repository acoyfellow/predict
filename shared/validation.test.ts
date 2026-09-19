import { describe, expect, test } from 'bun:test';
import { isMetadata } from './validation';

describe('metadata validation', () => {
  test('accepts a bounded JSON object', () => {
    expect(isMetadata({ experiment: 'comparison-v2', plan: 'team' })).toBe(true);
  });

  test('rejects arrays and primitive values', () => {
    expect(isMetadata(['experiment'])).toBe(false);
    expect(isMetadata('experiment')).toBe(false);
    expect(isMetadata(null)).toBe(false);
  });

  test('rejects oversized objects', () => {
    expect(isMetadata({ value: 'x'.repeat(8192) })).toBe(false);
  });
});
