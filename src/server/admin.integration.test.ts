import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestPrismaClient, resetTestDatabase } from "./testDb";

let dbClient: PrismaClient;

vi.mock("@/server/db", () => ({
  get prisma() {
    return dbClient;
  },
}));

import {
  listAuditLogs,
  listUsageLimits,
  listUsers,
  setUsageLimit,
  updateUserRole,
} from "./services/adminService";
import {
  checkDailyRoundtableLimit,
  enforceDailyRoundtableLimit,
  UsageLimitError,
} from "./services/usageLimitService";

describe("Admin roles, limits, and audit log integration", () => {
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        "postgresql://postgres:postgres@localhost:5433/sagetable_test",
      JWT_SECRET:
        process.env.JWT_SECRET ??
        "integration-test-jwt-secret-at-least-32-chars",
    };
    dbClient = createTestPrismaClient();
    await dbClient.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(dbClient);
  });

  afterAll(async () => {
    process.env = originalEnv;
    if (dbClient) {
      await dbClient.$disconnect();
    }
  });

  it("updates user role and records audit log in database", async () => {
    const admin = await dbClient.user.create({
      data: {
        email: "admin@sagetable.org",
        passwordHash: "hash-admin",
        role: "ADMIN",
      },
    });

    const targetUser = await dbClient.user.create({
      data: {
        email: "alice@sagetable.org",
        passwordHash: "hash-user",
        role: "USER",
      },
    });

    const updated = await updateUserRole(
      {
        actorId: admin.id,
        targetUserId: targetUser.id,
        newRole: "CURATOR",
      },
      dbClient,
    );

    expect(updated.role).toBe("CURATOR");

    // Check DB state
    const userInDb = await dbClient.user.findUnique({
      where: { id: targetUser.id },
    });
    expect(userInDb?.role).toBe("CURATOR");

    // Check audit log
    const logs = await dbClient.auditLog.findMany({
      where: { targetId: targetUser.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.actorId).toBe(admin.id);
    expect(logs[0]?.action).toBe("ROLE_CHANGE");
    expect(logs[0]?.before).toEqual({ role: "USER" });
    expect(logs[0]?.after).toEqual({ role: "CURATOR" });
  });

  it("sets usage limit and records audit log", async () => {
    const admin = await dbClient.user.create({
      data: {
        email: "admin2@sagetable.org",
        passwordHash: "hash-admin",
        role: "ADMIN",
      },
    });

    const limit = await setUsageLimit(
      {
        actorId: admin.id,
        role: "USER",
        dailyRoundtables: 10,
      },
      dbClient,
    );

    expect(limit.dailyRoundtables).toBe(10);

    const inDb = await dbClient.usageLimit.findUnique({
      where: { role: "USER" },
    });
    expect(inDb?.dailyRoundtables).toBe(10);

    const logs = await dbClient.auditLog.findMany({
      where: { targetId: "USER" },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe("USAGE_LIMIT_CHANGE");
    expect(logs[0]?.after).toEqual({ dailyRoundtables: 10 });
  });

  it("enforces daily roundtable limit with 429 and reset time", async () => {
    const user = await dbClient.user.create({
      data: {
        email: "reader@sagetable.org",
        passwordHash: "hash-reader",
        role: "USER",
      },
    });

    // Set user limit to 2
    await dbClient.usageLimit.create({
      data: {
        role: "USER",
        dailyRoundtables: 2,
      },
    });

    const now = new Date("2026-11-13T12:00:00Z");

    // Under limit (0 roundtables)
    const check1 = await checkDailyRoundtableLimit(user.id, "USER", dbClient, now);
    expect(check1.allowed).toBe(true);
    expect(check1.remaining).toBe(2);

    // Create 1 roundtable
    await dbClient.roundtable.create({
      data: {
        userId: user.id,
        question: "What is courage?",
        createdAt: new Date("2026-11-13T10:00:00Z"),
      },
    });

    const check2 = await checkDailyRoundtableLimit(user.id, "USER", dbClient, now);
    expect(check2.allowed).toBe(true);
    expect(check2.remaining).toBe(1);

    // Create second roundtable reaching limit
    await dbClient.roundtable.create({
      data: {
        userId: user.id,
        question: "What is love?",
        createdAt: new Date("2026-11-13T11:00:00Z"),
      },
    });

    const check3 = await checkDailyRoundtableLimit(user.id, "USER", dbClient, now);
    expect(check3.allowed).toBe(false);
    expect(check3.remaining).toBe(0);
    expect(check3.resetAt).toBe("2026-11-14T00:00:00.000Z");

    // enforceDailyRoundtableLimit throws UsageLimitError (429)
    await expect(
      enforceDailyRoundtableLimit(
        { id: user.id, role: "USER", email: user.email },
        dbClient,
        now,
      ),
    ).rejects.toThrow(UsageLimitError);

    try {
      await enforceDailyRoundtableLimit(
        { id: user.id, role: "USER", email: user.email },
        dbClient,
        now,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(UsageLimitError);
      const usageErr = err as UsageLimitError;
      expect(usageErr.status).toBe(429);
      expect(usageErr.code).toBe("USAGE_LIMIT_EXCEEDED");
      expect(usageErr.message).toContain("2026-11-14T00:00:00.000Z");
      expect(usageErr.resetAt).toBe("2026-11-14T00:00:00.000Z");
    }
  });

  it("lists users and audit logs", async () => {
    await dbClient.user.create({
      data: {
        email: "admin3@sagetable.org",
        passwordHash: "hash-admin",
        role: "ADMIN",
      },
    });

    const users = await listUsers(dbClient);
    expect(users).toHaveLength(1);
    expect((users[0] as unknown as Record<string, unknown>).passwordHash).toBeUndefined();

    const limits = await listUsageLimits(dbClient);
    expect(limits).toHaveLength(3);

    const logs = await listAuditLogs(50, dbClient);
    expect(logs).toHaveLength(0);
  });
});
