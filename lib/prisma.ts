// Prisma 7 requires a driver adapter — DATABASE_POSTGRES_URL is passed via PrismaPg.
// Run `prisma generate` and set DATABASE_POSTGRES_URL before using.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type PrismaClientType = PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

function createPrismaClient(): PrismaClientType {
  const connectionString = process.env.DATABASE_POSTGRES_URL;
  if (!connectionString) {
    throw new Error('DATABASE_POSTGRES_URL environment variable is not set');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClientType =
  globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
