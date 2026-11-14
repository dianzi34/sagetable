import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

const signInUserMock = vi.fn();

vi.mock("@/server/services/authService", () => {
  class MockAuthServiceError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return {
    AuthServiceError: MockAuthServiceError,
    signInUser: (...args: unknown[]) => signInUserMock(...args),
  };
});

import { AuthServiceError } from "@/server/services/authService";
import { POST } from "./route";

describe("POST /api/auth/sign-in", () => {
  beforeEach(() => {
    signInUserMock.mockReset();
  });

  it("returns 200 and sets an httpOnly JWT session cookie on valid credentials", async () => {
    signInUserMock.mockResolvedValueOnce({
      user: { id: "user-1", email: "curator@example.com", role: "curator" },
      token: "curator.jwt.token",
    });

    const request = new Request("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "Curator@Example.com",
        password: "correct-password",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        user: {
          id: "user-1",
          email: "curator@example.com",
          role: "curator",
        },
      },
    });
    expect(signInUserMock).toHaveBeenCalledWith({
      email: "curator@example.com",
      password: "correct-password",
    });

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=curator.jwt.token`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("returns 400 for malformed input and 401 for wrong credentials", async () => {
    const invalidRes = await POST(
      new Request("http://localhost:3000/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "" }),
      }),
    );
    expect(invalidRes.status).toBe(400);

    signInUserMock.mockRejectedValueOnce(
      new AuthServiceError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password",
      ),
    );

    const wrongRes = await POST(
      new Request("http://localhost:3000/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "alice@example.com",
          password: "wrong-password",
        }),
      }),
    );
    expect(wrongRes.status).toBe(401);
    await expect(wrongRes.json()).resolves.toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
  });
});
