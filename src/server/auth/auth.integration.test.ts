import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "../../lib/auth";
import { createTestPrismaClient, resetTestDatabase } from "../testDb";

const { testPrisma } = vi.hoisted(() => ({
  testPrisma: undefined as PrismaClient | undefined,
}));

let dbClient: PrismaClient;

vi.mock("@/server/db", () => ({
  get prisma() {
    return dbClient;
  },
}));

import { verifySessionToken } from "./jwt";
import { assertResourceOwnership, requireRole } from "./session";
import {
  AuthServiceError,
  registerUser,
  signInUser,
} from "../services/authService";

describe("Auth service, JWT roles, and ownership integration", () => {
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
    void testPrisma;
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

  it("registers a user with hashed password, signs in, and rejects duplicate emails or wrong passwords", async () => {
    const plainPassword = "roundtable-secret-88";

    const registered = await registerUser({
      email: "  Reader@SageTable.org ",
      password: plainPassword,
    });

    expect(registered.user).toMatchObject({
      email: "reader@sagetable.org",
      role: "user",
    });
    expect("passwordHash" in registered.user).toBe(false);

    const dbUser = await dbClient.user.findUniqueOrThrow({
      where: { email: "reader@sagetable.org" },
    });
    expect(dbUser.passwordHash).not.toBe(plainPassword);
    expect(dbUser.passwordHash.startsWith("$2")).toBe(true);
    expect(dbUser.role).toBe("USER");

    await expect(
      registerUser({
        email: "reader@sagetable.org",
        password: "another-valid-password",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });

    const signedIn = await signInUser({
      email: "reader@sagetable.org",
      password: plainPassword,
    });
    expect(signedIn.user).toEqual(registered.user);

    const claims = await verifySessionToken(signedIn.token);
    expect(claims).toEqual(registered.user);

    await expect(
      signInUser({
        email: "reader@sagetable.org",
        password: "wrong-password-attempt",
      }),
    ).rejects.toBeInstanceOf(AuthServiceError);

    await expect(
      signInUser({
        email: "reader@sagetable.org",
        password: "wrong-password-attempt",
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("issues signed JWTs for user, curator, and admin accounts and enforces requireRole()", async () => {
    const seeded = await Promise.all([
      registerUser({ email: "user@test.org", password: "password123" }),
      registerUser({ email: "curator@test.org", password: "password123" }),
      registerUser({ email: "admin@test.org", password: "password123" }),
    ]);

    await dbClient.user.update({
      where: { id: seeded[1].user.id },
      data: { role: "CURATOR" },
    });
    await dbClient.user.update({
      where: { id: seeded[2].user.id },
      data: { role: "ADMIN" },
    });

    const userSession = await signInUser({
      email: "user@test.org",
      password: "password123",
    });
    const curatorSession = await signInUser({
      email: "curator@test.org",
      password: "password123",
    });
    const adminSession = await signInUser({
      email: "admin@test.org",
      password: "password123",
    });

    expect(userSession.user.role).toBe("user");
    expect(curatorSession.user.role).toBe("curator");
    expect(adminSession.user.role).toBe("admin");

    const userReq = new Request("http://localhost:3000/api/curator", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${userSession.token}` },
    });
    const curatorReq = new Request("http://localhost:3000/api/curator", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${curatorSession.token}` },
    });
    const adminReq = new Request("http://localhost:3000/api/admin", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${adminSession.token}` },
    });

    await expect(requireRole("curator", userReq)).rejects.toMatchObject({
      status: 403,
    });
    await expect(requireRole("curator", curatorReq)).resolves.toMatchObject({
      role: "curator",
    });
    await expect(requireRole("admin", curatorReq)).rejects.toMatchObject({
      status: 403,
    });
    await expect(requireRole("admin", adminReq)).resolves.toMatchObject({
      role: "admin",
    });
  });

  it("ensures a user can only access their own roundtables", async () => {
    const owner = await registerUser({
      email: "owner@test.org",
      password: "password123",
    });
    const stranger = await registerUser({
      email: "stranger@test.org",
      password: "password123",
    });

    const ownerRoundtable = await dbClient.roundtable.create({
      data: {
        userId: owner.user.id,
        question: "How do we stay curious through long experiments?",
      },
    });

    const ownerScoped = await dbClient.roundtable.findFirst({
      where: { id: ownerRoundtable.id, userId: owner.user.id },
    });
    expect(
      assertResourceOwnership(ownerScoped, owner.user.id, "Roundtable"),
    ).toMatchObject({
      id: ownerRoundtable.id,
      userId: owner.user.id,
    });

    const strangerScoped = await dbClient.roundtable.findFirst({
      where: { id: ownerRoundtable.id, userId: stranger.user.id },
    });
    expect(strangerScoped).toBeNull();
    expect(() =>
      assertResourceOwnership(strangerScoped, stranger.user.id, "Roundtable"),
    ).toThrowError(/not found/i);

    const directLookup = await dbClient.roundtable.findUnique({
      where: { id: ownerRoundtable.id },
    });
    try {
      assertResourceOwnership(directLookup, stranger.user.id, "Roundtable");
      expect.unreachable("Expected 404 when non-owner accesses roundtable");
    } catch (err) {
      expect(err).toMatchObject({ status: 404, code: "NOT_FOUND" });
    }
  });
});
