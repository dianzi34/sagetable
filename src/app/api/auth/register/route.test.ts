import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

const registerUserMock = vi.fn();

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
    registerUser: (...args: unknown[]) => registerUserMock(...args),
  };
});

import { AuthServiceError } from "@/server/services/authService";
import { POST } from "./route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    registerUserMock.mockReset();
  });

  it("returns 201, user payload without passwordHash, and sets an httpOnly session cookie", async () => {
    registerUserMock.mockResolvedValueOnce({
      user: { id: "user-1", email: "alice@example.com", role: "user" },
      token: "signed.jwt.token",
    });

    const request = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "Alice@Example.com",
        password: "strong-password-123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        user: { id: "user-1", email: "alice@example.com", role: "user" },
      },
    });
    expect(registerUserMock).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "strong-password-123",
    });

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=signed.jwt.token`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("returns 400 when password is under 8 characters or JSON is invalid", async () => {
    const shortPasswordReq = new Request(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "alice@example.com", password: "short" }),
      },
    );

    const shortRes = await POST(shortPasswordReq);
    expect(shortRes.status).toBe(400);
    const shortBody = await shortRes.json();
    expect(shortBody.error.code).toBe("VALIDATION_ERROR");
    expect(shortBody.error.message).toMatch(/8/);
    expect(registerUserMock).not.toHaveBeenCalled();

    const invalidJsonReq = new Request(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad-json",
      },
    );
    const jsonRes = await POST(invalidJsonReq);
    expect(jsonRes.status).toBe(400);
    await expect(jsonRes.json()).resolves.toMatchObject({
      error: { code: "INVALID_JSON" },
    });
  });

  it("returns 409 when the email is already registered", async () => {
    registerUserMock.mockRejectedValueOnce(
      new AuthServiceError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists",
      ),
    );

    const request = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "strong-password-123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "An account with this email already exists",
      },
    });
  });
});
