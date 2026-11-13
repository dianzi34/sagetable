import "server-only";
import type { Prisma, PrismaClient, Role } from "@prisma/client";
import { prisma as defaultPrisma } from "@/server/db";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_USAGE_LIMITS: Record<Role, number> = {
  USER: 5,
  CURATOR: 20,
  ADMIN: 100,
};

export class UsageLimitError extends Error {
  readonly status = 429;
  readonly code = "USAGE_LIMIT_EXCEEDED";
  readonly resetAt: string;
  readonly limit?: number;

  constructor(resetAt: string, limit?: number) {
    const limitInfo = limit !== undefined ? ` of ${limit}` : "";
    super(
      `Daily roundtable limit${limitInfo} reached. Limit resets at ${resetAt}`,
    );
    this.name = "UsageLimitError";
    this.resetAt = resetAt;
    this.limit = limit;
  }
}

export interface LimitStatus {
  allowed: boolean;
  usage: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

/**
 * Get UTC day range boundaries [startOfDay, startOfNextDay] for a given date.
 */
function getUtcDayRange(now: Date): { startOfDay: Date; startOfNextDay: Date } {
  const startOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const startOfNextDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return { startOfDay, startOfNextDay };
}

/**
 * Count the roundtables created by a user on the current UTC date.
 */
export async function getDailyRoundtableUsage(
  userId: string,
  db: PrismaLike = defaultPrisma,
  now: Date = new Date(),
): Promise<number> {
  const { startOfDay, startOfNextDay } = getUtcDayRange(now);

  return db.roundtable.count({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lt: startOfNextDay,
      },
    },
  });
}

/**
 * Check whether a user has remaining roundtable generations for today.
 */
export async function checkDailyRoundtableLimit(
  userId: string,
  roleInput: Role | string,
  db: PrismaLike = defaultPrisma,
  now: Date = new Date(),
): Promise<LimitStatus> {
  const role = roleInput.toUpperCase() as Role;
  const { startOfNextDay } = getUtcDayRange(now);
  const resetAt = startOfNextDay.toISOString();

  const [usage, limitRecord] = await Promise.all([
    getDailyRoundtableUsage(userId, db, now),
    db.usageLimit.findUnique({
      where: { role },
    }),
  ]);

  const limit = limitRecord?.dailyRoundtables ?? (DEFAULT_USAGE_LIMITS[role] ?? 5);
  const allowed = usage < limit;
  const remaining = Math.max(0, limit - usage);

  return {
    allowed,
    usage,
    limit,
    remaining,
    resetAt,
  };
}

/**
 * Enforce the daily roundtable limit, throwing a 429 UsageLimitError if the user has reached their quota.
 */
export async function enforceDailyRoundtableLimit(
  user: { id: string; role: Role | string; email?: string },
  db: PrismaLike = defaultPrisma,
  now: Date = new Date(),
): Promise<void> {
  const status = await checkDailyRoundtableLimit(user.id, user.role, db, now);

  if (!status.allowed) {
    throw new UsageLimitError(status.resetAt, status.limit);
  }
}
