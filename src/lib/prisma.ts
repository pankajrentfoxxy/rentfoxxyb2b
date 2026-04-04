import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Default: classic Prisma engine + `DATABASE_URL` (works well with local PostgreSQL / DBeaver).
 * Set `PRISMA_USE_PG_ADAPTER=true` only if you need the JS driver adapter (e.g. some hosted setups).
 */
function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (process.env.PRISMA_USE_PG_ADAPTER === "true") {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
  }

  return new PrismaClient({
    datasources: { db: { url: connectionString } },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
