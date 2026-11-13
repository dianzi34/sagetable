import { describe, expect, it, vi } from "vitest";
import {
  checkDailyRoundtableLimit,
  enforceDailyRoundtableLimit,
  getDailyRoundtableUsage,
  UsageLimitError,
} from "./usageLimitService";

describe("usageLimitService (unit)", () => {
  it("getDailyRoundtableUsage counts roundtables created today (UTC)", async () => {
    const fixedNow = new Date("2026-11-13T14:30:00Z");
    const mockPrisma = {
      roundtable: {
        count: vi.fn().mockResolvedValue(3),
      },
    };

    const usage = await getDailyRoundtableUsage(
      "user-1",
      mockPrisma as never,
      fixedNow,
    );

    expect(usage).toBe(3);
    expect(mockPrisma.roundtable.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        createdAt: {
          gte: new Date("2026-11-13T00:00:00.000Z"),
          lt: new Date("2026-11-14T00:00:00.000Z"),
        },
      },
    });
  });

  it("checkDailyRoundtableLimit returns allowed=true when below limit", async () => {
    const fixedNow = new Date("2026-11-13T10:00:00Z");
    const mockPrisma = {
      roundtable: {
        count: vi.fn().mockResolvedValue(2),
      },
      usageLimit: {
        findUnique: vi.fn().mockResolvedValue({
          role: "USER",
          dailyRoundtables: 5,
        }),
      },
    };

    const status = await checkDailyRoundtableLimit(
      "user-1",
      "USER",
      mockPrisma as never,
      fixedNow,
    );

    expect(status.allowed).toBe(true);
    expect(status.usage).toBe(2);
    expect(status.limit).toBe(5);
    expect(status.remaining).toBe(3);
    expect(status.resetAt).toBe("2026-11-14T00:00:00.000Z");
  });

  it("checkDailyRoundtableLimit returns allowed=false when limit reached", async () => {
    const fixedNow = new Date("2026-11-13T10:00:00Z");
    const mockPrisma = {
      roundtable: {
        count: vi.fn().mockResolvedValue(5),
      },
      usageLimit: {
        findUnique: vi.fn().mockResolvedValue({
          role: "USER",
          dailyRoundtables: 5,
        }),
      },
    };

    const status = await checkDailyRoundtableLimit(
      "user-1",
      "USER",
      mockPrisma as never,
      fixedNow,
    );

    expect(status.allowed).toBe(false);
    expect(status.usage).toBe(5);
    expect(status.limit).toBe(5);
    expect(status.remaining).toBe(0);
    expect(status.resetAt).toBe("2026-11-14T00:00:00.000Z");
  });

  it("enforceDailyRoundtableLimit throws UsageLimitError(429) with reset time message when reached", async () => {
    const fixedNow = new Date("2026-11-13T10:00:00Z");
    const mockPrisma = {
      roundtable: {
        count: vi.fn().mockResolvedValue(5),
      },
      usageLimit: {
        findUnique: vi.fn().mockResolvedValue({
          role: "USER",
          dailyRoundtables: 5,
        }),
      },
    };

    let error: UsageLimitError | null = null;
    try {
      await enforceDailyRoundtableLimit(
        { id: "user-1", role: "USER", email: "user@example.com" },
        mockPrisma as never,
        fixedNow,
      );
    } catch (err) {
      if (err instanceof UsageLimitError) {
        error = err;
      }
    }

    expect(error).not.toBeNull();
    expect(error?.status).toBe(429);
    expect(error?.code).toBe("USAGE_LIMIT_EXCEEDED");
    expect(error?.message).toContain("2026-11-14T00:00:00.000Z");
    expect(error?.resetAt).toBe("2026-11-14T00:00:00.000Z");
  });

  it("enforceDailyRoundtableLimit succeeds without throwing when under limit", async () => {
    const fixedNow = new Date("2026-11-13T10:00:00Z");
    const mockPrisma = {
      roundtable: {
        count: vi.fn().mockResolvedValue(1),
      },
      usageLimit: {
        findUnique: vi.fn().mockResolvedValue({
          role: "USER",
          dailyRoundtables: 5,
        }),
      },
    };

    await expect(
      enforceDailyRoundtableLimit(
        { id: "user-1", role: "USER", email: "user@example.com" },
        mockPrisma as never,
        fixedNow,
      ),
    ).resolves.not.toThrow();
  });
});
