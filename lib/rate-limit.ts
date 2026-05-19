export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 10;

export function isRateLimited(attemptCount: number): boolean {
  return attemptCount >= RATE_LIMIT_MAX;
}
