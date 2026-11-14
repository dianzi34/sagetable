import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { POST } from "./route";

describe("POST /api/auth/sign-out", () => {
  it("clears the httpOnly session cookie and returns 200", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { signedOut: true },
    });

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});
