// Prisma client singleton — uses lazy initialization so that
// missing DATABASE_URL or missing generated client at build time
// does not crash the module during static analysis.
// Run `prisma generate` and set DATABASE_URL before using.

// any: Prisma generated types are not available until `prisma generate` runs
type PrismaClientType = any; // skipcq: JS-0323

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

function createPrismaClient(): PrismaClientType {
  // Dynamic require avoids a crash when the generated client doesn't exist yet (e.g. fresh clone).
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma: PrismaClientType =
  globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
