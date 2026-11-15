import { describe, expect, it, vi } from "vitest";
import {
  listAuditLogs,
  listUsageLimits,
  listUsers,
  setUsageLimit,
  updateUserRole,
} from "./adminService";

describe("adminService (unit)", () => {
  it("listUsers returns users without passwordHash", async () => {
    const mockPrisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "user-1",
            email: "alice@example.com",
            role: "USER",
            createdAt: new Date("2026-11-01T00:00:00Z"),
          },
        ]),
      },
    };

    const users = await listUsers(mockPrisma as never);

    expect(users).toHaveLength(1);
    expect(users[0]).toEqual({
      id: "user-1",
      email: "alice@example.com",
      role: "USER",
      createdAt: new Date("2026-11-01T00:00:00Z"),
    });
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("updateUserRole records an audit log and updates user role", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "target-user",
          email: "bob@example.com",
          role: "USER",
        }),
        update: vi.fn().mockResolvedValue({
          id: "target-user",
          email: "bob@example.com",
          role: "CURATOR",
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({
          id: "log-1",
          actorId: "admin-1",
          action: "ROLE_CHANGE",
          targetId: "target-user",
          before: { role: "USER" },
          after: { role: "CURATOR" },
        }),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    const updated = await updateUserRole(
      {
        actorId: "admin-1",
        targetUserId: "target-user",
        newRole: "CURATOR",
      },
      mockPrisma as never,
    );

    expect(updated.role).toBe("CURATOR");
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "admin-1",
        action: "ROLE_CHANGE",
        targetId: "target-user",
        before: { role: "USER" },
        after: { role: "CURATOR" },
      },
    });
  });

  it("updateUserRole throws not found if user does not exist", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    await expect(
      updateUserRole(
        {
          actorId: "admin-1",
          targetUserId: "nonexistent",
          newRole: "ADMIN",
        },
        mockPrisma as never,
      ),
    ).rejects.toThrow("User not found");
  });

  it("listUsageLimits returns limits for all roles with default fallbacks", async () => {
    const mockPrisma = {
      usageLimit: {
        findMany: vi.fn().mockResolvedValue([
          { role: "USER", dailyRoundtables: 5 },
          { role: "CURATOR", dailyRoundtables: 20 },
        ]),
      },
    };

    const limits = await listUsageLimits(mockPrisma as never);

    expect(limits).toHaveLength(3);
    const userLimit = limits.find((l) => l.role === "USER");
    const curatorLimit = limits.find((l) => l.role === "CURATOR");
    const adminLimit = limits.find((l) => l.role === "ADMIN");

    expect(userLimit?.dailyRoundtables).toBe(5);
    expect(curatorLimit?.dailyRoundtables).toBe(20);
    expect(adminLimit?.dailyRoundtables).toBeGreaterThanOrEqual(100);
  });

  it("setUsageLimit upserts limit and records audit log", async () => {
    const mockPrisma = {
      usageLimit: {
        findUnique: vi.fn().mockResolvedValue({
          role: "USER",
          dailyRoundtables: 5,
        }),
        upsert: vi.fn().mockResolvedValue({
          role: "USER",
          dailyRoundtables: 10,
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({
          id: "log-limit-1",
          actorId: "admin-1",
          action: "USAGE_LIMIT_CHANGE",
          targetId: "USER",
          before: { dailyRoundtables: 5 },
          after: { dailyRoundtables: 10 },
        }),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    const updated = await setUsageLimit(
      {
        actorId: "admin-1",
        role: "USER",
        dailyRoundtables: 10,
      },
      mockPrisma as never,
    );

    expect(updated.dailyRoundtables).toBe(10);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "admin-1",
        action: "USAGE_LIMIT_CHANGE",
        targetId: "USER",
        before: { dailyRoundtables: 5 },
        after: { dailyRoundtables: 10 },
      },
    });
  });

  it("listAuditLogs returns audit logs with actor email", async () => {
    const mockPrisma = {
      auditLog: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "log-1",
            actorId: "admin-1",
            action: "ROLE_CHANGE",
            targetId: "user-2",
            before: { role: "USER" },
            after: { role: "CURATOR" },
            createdAt: new Date("2026-11-12T10:00:00Z"),
            actor: {
              email: "admin@example.com",
              role: "ADMIN",
            },
          },
        ]),
      },
    };

    const logs = await listAuditLogs(50, mockPrisma as never);

    expect(logs).toHaveLength(1);
    expect(logs[0]?.actor?.email).toBe("admin@example.com");
    expect(logs[0]?.action).toBe("ROLE_CHANGE");
  });
});
