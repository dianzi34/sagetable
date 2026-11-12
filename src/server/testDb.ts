import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Return the dedicated integration test database URL, failing fast if unset.
 */
export function getTestDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_TEST?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL_TEST must be set to run integration tests safely.",
    );
  }
  return url;
}

/**
 * Create an isolated PrismaClient connected to DATABASE_URL_TEST.
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: getTestDatabaseUrl(),
      },
    },
  });
}

/**
 * Clear all application tables in dependency order between integration tests.
 */
export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.usageLimit.deleteMany(),
    prisma.flag.deleteMany(),
    prisma.roundtableAnswer.deleteMany(),
    prisma.roundtable.deleteMany(),
    prisma.answerPassage.deleteMany(),
    prisma.answer.deleteMany(),
    prisma.passage.deleteMany(),
    prisma.work.deleteMany(),
    prisma.figureTheme.deleteMany(),
    prisma.theme.deleteMany(),
    prisma.figure.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
