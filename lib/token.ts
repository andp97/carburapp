import crypto from 'crypto';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function isTokenValid(record: { expiresAt: Date; usedAt: Date | null }): boolean {
  return record.usedAt === null && record.expiresAt > new Date();
}
