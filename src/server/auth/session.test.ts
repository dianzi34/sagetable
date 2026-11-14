import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import {
  clearSessionCookie,
  getSessionCookieOptions,
  setSessionCookie,
} from "./cookie";
import { signSessionToken } from "./jwt";

const mockUserFindUnique = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

import {
  AuthError,
  assertResourceOwnership,
  requireRole,
  requireUser,
} from "./session";

const VALID_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/sagetable";
const VALID_JWT_SECRET = "sagetable-session-test-secret-32-chars!";

describe("session cookies, requireUser, requireRole, and ownership checks", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: VALID_DATABASE_URL,
      JWT_SECRET: VALID_JWT_SECRET,
    };
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
        if (where.id === "user-42") {
          return { id: "user-42", email: "curie@example.com", role: "USER" };
        }
        if (where.id === "u1") {
          return { id: "u1", email: "u1@example.com", role: "USER" };
        }
        if (where.id === "c1") {
          return { id: "c1", email: "c1@example.com", role: "CURATOR" };
        }
        if (where.id === "a1") {
          return { id: "a1", email: "a1@example.com", role: "ADMIN" };
        }
        return null;
      },
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("cookie options and response helpers", () => {
    it("sets httpOnly, SameSite=Lax, and production Secure cookie options", () => {
      process.env = { ...process.env, NODE_ENV: "production" };
      expect(getSessionCookieOptions()).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
      });

      process.env = { ...process.env, NODE_ENV: "test" };
      expect(getSessionCookieOptions()).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });
    });

    it("sets and clears the session cookie on NextResponse", () => {
      const setRes = NextResponse.json({ data: { ok: true } });
      setSessionCookie(setRes, "jwt-token-value");

      const setHeader = setRes.headers.get("set-cookie") ?? "";
      expect(setHeader).toContain(`${SESSION_COOKIE_NAME}=jwt-token-value`);
      expect(setHeader).toContain("HttpOnly");
      expect(setHeader.toLowerCase()).toContain("samesite=lax");

      const clearRes = NextResponse.json({ data: { signedOut: true } });
      clearSessionCookie(clearRes);

      const clearHeader = clearRes.headers.get("set-cookie") ?? "";
      expect(clearHeader).toContain(`${SESSION_COOKIE_NAME}=`);
      expect(clearHeader).toContain("Max-Age=0");
      expect(clearHeader).toContain("HttpOnly");
    });
  });

  describe("requireUser and requireRole", () => {
    it("throws 401 AuthError when the session cookie is missing or invalid", async () => {
      const noCookieReq = new Request("http://localhost:3000/api/auth/me");
      await expect(requireUser(noCookieReq)).rejects.toMatchObject({
        name: "AuthError",
        status: 401,
        code: "UNAUTHORIZED",
      });

      const badCookieReq = new Request("http://localhost:3000/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=invalid-token` },
      });
      await expect(requireUser(badCookieReq)).rejects.toBeInstanceOf(AuthError);
      await expect(requireUser(badCookieReq)).rejects.toMatchObject({
        status: 401,
      });
    });

    it("returns the signed-in user when the cookie carries a valid JWT", async () => {
      const token = await signSessionToken({
        id: "user-42",
        email: "curie@example.com",
        role: "user",
      });
      const request = new Request("http://localhost:3000/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      });

      await expect(requireUser(request)).resolves.toEqual({
        id: "user-42",
        email: "curie@example.com",
        role: "user",
      });
    });

    it("enforces role checks on the server with 401 when unauthenticated and 403 when insufficient", async () => {
      const noCookieReq = new Request("http://localhost:3000/api/curator/flags");
      await expect(requireRole("curator", noCookieReq)).rejects.toMatchObject({
        status: 401,
      });

      const userToken = await signSessionToken({
        id: "u1",
        email: "u1@example.com",
        role: "user",
      });
      const userReq = new Request("http://localhost:3000/api/curator/flags", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${userToken}` },
      });
      await expect(requireRole("curator", userReq)).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
      });

      const curatorToken = await signSessionToken({
        id: "c1",
        email: "c1@example.com",
        role: "curator",
      });
      const curatorReq = new Request("http://localhost:3000/api/curator/flags", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${curatorToken}` },
      });
      await expect(requireRole("curator", curatorReq)).resolves.toEqual({
        id: "c1",
        email: "c1@example.com",
        role: "curator",
      });
      await expect(requireRole("admin", curatorReq)).rejects.toMatchObject({
        status: 403,
      });

      const adminToken = await signSessionToken({
        id: "a1",
        email: "a1@example.com",
        role: "admin",
      });
      const adminReq = new Request("http://localhost:3000/api/admin/audit", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
      });
      await expect(
        requireRole(["curator", "admin"], adminReq),
      ).resolves.toEqual({
        id: "a1",
        email: "a1@example.com",
        role: "admin",
      });
    });

    it("throws 401 when the user no longer exists in the database", async () => {
      mockUserFindUnique.mockResolvedValueOnce(null);

      const token = await signSessionToken({
        id: "deleted-user",
        email: "gone@example.com",
        role: "user",
      });
      const req = new Request("http://localhost:3000/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      });

      await expect(requireUser(req)).rejects.toMatchObject({
        name: "AuthError",
        status: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("throws 403 when user's database role has been demoted even if JWT role was privileged", async () => {
      // JWT claims curator, but database record has been demoted to USER
      mockUserFindUnique.mockResolvedValueOnce({
        id: "c1",
        email: "c1@example.com",
        role: "USER",
      });

      const curatorToken = await signSessionToken({
        id: "c1",
        email: "c1@example.com",
        role: "curator",
      });
      const curatorReq = new Request("http://localhost:3000/api/curator/flags", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${curatorToken}` },
      });

      await expect(requireRole("curator", curatorReq)).rejects.toMatchObject({
        name: "AuthError",
        status: 403,
        code: "FORBIDDEN",
      });
    });
  });

  describe("assertResourceOwnership", () => {
    it("returns the resource when owned by the actor and throws 404 (not 403) otherwise", () => {
      const owned = { id: "rt-1", userId: "user-a", question: "Why?" };
      expect(assertResourceOwnership(owned, "user-a", "Roundtable")).toBe(
        owned,
      );

      expect(() =>
        assertResourceOwnership(owned, "user-b", "Roundtable"),
      ).toThrowError(AuthError);

      try {
        assertResourceOwnership(owned, "user-b", "Roundtable");
      } catch (err) {
        expect(err).toMatchObject({ status: 404, code: "NOT_FOUND" });
      }

      try {
        assertResourceOwnership(null, "user-a", "Roundtable");
      } catch (err) {
        expect(err).toMatchObject({ status: 404, code: "NOT_FOUND" });
      }
    });
  });
});
