// Prisma client singleton — uses lazy initialization so that
// missing DATABASE_URL or missing generated client at build time
// does not crash the module during static analysis.
// Run `prisma generate` and set DATABASE_URL before using.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

function createPrismaClient(): PrismaClientType {
  // Dynamically require so we don't break at import time if client isn't generated
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma: PrismaClientType =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
