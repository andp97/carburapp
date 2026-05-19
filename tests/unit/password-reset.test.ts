import { describe, it, expect } from 'vitest';
import { hashToken, isTokenValid } from '../../lib/token';

describe('hashToken', () => {
  it('returns a 64-char hex SHA-256 digest', () => {
    const result = hashToken('abc');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it('is deterministic for the same input', () => {
    expect(hashToken('hello')).toBe(hashToken('hello'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('foo')).not.toBe(hashToken('bar'));
  });
});

describe('isTokenValid', () => {
  it('returns true when token is not expired and not used', () => {
    const record = {
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    };
    expect(isTokenValid(record)).toBe(true);
  });

  it('returns false when token is expired', () => {
    const record = {
      expiresAt: new Date(Date.now() - 1),
      usedAt: null,
    };
    expect(isTokenValid(record)).toBe(false);
  });

  it('returns false when token has been used', () => {
    const record = {
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    };
    expect(isTokenValid(record)).toBe(false);
  });
});
