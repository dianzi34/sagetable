import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { config, middleware } from "./middleware";

const VALID_JWT_SECRET = "sagetable-middleware-test-secret-32-bytes";

async function createSignedCookie(role: "user" | "curator" | "admin"): Promise<string> {
  return new SignJWT({ email: `${role}@sagetable.test`, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(`id-${role}`)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(VALID_JWT_SECRET));
}

describe("middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: VALID_JWT_SECRET,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("redirects unauthenticated users opening roundtables, themes, or the notebook to sign-in", async () => {
    for (const path of [
      "/roundtable/rt-123?tab=notes",
      "/themes",
      "/notebook",
      "/curator",
      "/admin",
    ]) {
      const request = new NextRequest(`http://localhost:3000${path}`);
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBeTruthy();

      const redirectUrl = new URL(location ?? "", "http://localhost:3000");
      expect(redirectUrl.pathname).toBe("/sign-in");
      expect(redirectUrl.searchParams.get("callbackUrl")).toBe(path);
    }
  });

  it("redirects when the session cookie contains an invalid or tampered JWT", async () => {
    const request = new NextRequest("http://localhost:3000/notebook", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=not.a.valid.jwt`,
      },
    });

    const response = await middleware(request);
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(new URL(location).pathname).toBe("/sign-in");
  });

  it("allows authenticated users through to protected routes", async () => {
    const token = await createSignedCookie("user");
    const request = new NextRequest("http://localhost:3000/notebook", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });

    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("matches dynamic roundtable and notebook paths while leaving public routes uncovered", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining([
        "/themes/:path*",
        "/roundtable/:path+",
        "/roundtables/:path*",
        "/notebook/:path*",
        "/curator/:path*",
        "/admin/:path*",
      ]),
    );
    expect(config.matcher).not.toContain("/sign-in");
    expect(config.matcher).not.toContain("/roundtable");
  });
});
