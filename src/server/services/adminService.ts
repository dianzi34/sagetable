import "server-only";
import { Prisma } from "@prisma/client";
import type { PrismaClient, Role } from "@prisma/client";
import { prisma as defaultPrisma } from "@/server/db";
import { DEFAULT_USAGE_LIMITS } from "./usageLimitService";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export interface AdminUserListItem {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface UsageLimitItem {
  role: Role;
  dailyRoundtables: number;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  before: Prisma.JsonValue;
  after: Prisma.JsonValue;
  createdAt: Date;
  actor: {
    email: string;
    role: Role;
  } | null;
}

/**
 * List all registered users for admin overview, excluding password hashes.
 */
export async function listUsers(
  db: PrismaLike = defaultPrisma,
): Promise<AdminUserListItem[]> {
  return db.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update a user's role and record an audit log entry in a single transaction.
 */
export async function updateUserRole(
  input: {
    actorId: string;
    targetUserId: string;
    newRole: Role;
  },
  db: PrismaLike = defaultPrisma,
): Promise<AdminUserListItem> {
  const runTransaction = async (tx: PrismaLike): Promise<AdminUserListItem> => {
    const targetUser = await tx.user.findUnique({
      where: { id: input.targetUserId },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    const previousRole = targetUser.role;

    const updated = await tx.user.update({
      where: { id: input.targetUserId },
      data: { role: input.newRole },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "ROLE_CHANGE",
        targetId: input.targetUserId,
        before: { role: previousRole },
        after: { role: input.newRole },
      },
    });

    return updated;
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(runTransaction);
  }

  return runTransaction(db);
}

/**
 * List daily usage limits for all roles, providing default fallbacks if unset in the DB.
 */
export async function listUsageLimits(
  db: PrismaLike = defaultPrisma,
): Promise<UsageLimitItem[]> {
  const existingLimits = await db.usageLimit.findMany();
  const limitMap = new Map<Role, number>(
    existingLimits.map((limit) => [limit.role, limit.dailyRoundtables]),
  );

  const roles: Role[] = ["USER", "CURATOR", "ADMIN"];

  return roles.map((role) => ({
    role,
    dailyRoundtables: limitMap.get(role) ?? DEFAULT_USAGE_LIMITS[role],
  }));
}

/**
 * Set the daily roundtable limit for a role and record an audit log.
 */
export async function setUsageLimit(
  input: {
    actorId: string;
    role: Role;
    dailyRoundtables: number;
  },
  db: PrismaLike = defaultPrisma,
): Promise<UsageLimitItem> {
  const runTransaction = async (tx: PrismaLike): Promise<UsageLimitItem> => {
    const existing = await tx.usageLimit.findUnique({
      where: { role: input.role },
    });

    const updated = await tx.usageLimit.upsert({
      where: { role: input.role },
      update: { dailyRoundtables: input.dailyRoundtables },
      create: {
        role: input.role,
        dailyRoundtables: input.dailyRoundtables,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "USAGE_LIMIT_CHANGE",
        targetId: input.role,
        before: existing ? { dailyRoundtables: existing.dailyRoundtables } : Prisma.DbNull,
        after: { dailyRoundtables: input.dailyRoundtables },
      },
    });

    return {
      role: updated.role,
      dailyRoundtables: updated.dailyRoundtables,
    };
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(runTransaction);
  }

  return runTransaction(db);
}

/**
 * List the most recent audit log entries with the actor's email.
 */
export async function listAuditLogs(
  limit = 50,
  db: PrismaLike = defaultPrisma,
): Promise<AuditLogItem[]> {
  return db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });
}
