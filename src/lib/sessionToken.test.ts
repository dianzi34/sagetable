// @vitest-environment node
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { verifySessionJwt } from "./sessionToken";

const SECRET = "test-jwt-secret-that-is-at-least-32-chars";

async function makeToken(
  payload: Record<string, unknown>,
  secret = SECRET,
  expiresIn = "1h",
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(typeof payload.sub === "string" ? payload.sub : "user-1")
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

describe("verifySessionJwt", () => {
  it("verifies valid user, curator, and admin JWTs", async () => {
    for (const role of ["user", "curator", "admin"] as const) {
      const token = await makeToken({
        sub: `id-${role}`,
        email: `${role}@example.com`,
        role,
      });

      await expect(verifySessionJwt(token, SECRET)).resolves.toEqual({
        id: `id-${role}`,
        email: `${role}@example.com`,
        role,
      });
    }
  });

  it("returns null for tampered, wrong-secret, malformed, or invalid-role tokens", async () => {
    const valid = await makeToken({
      sub: "u1",
      email: "a@example.com",
      role: "user",
    });
    const wrongRole = await makeToken({
      sub: "u1",
      email: "a@example.com",
      role: "owner",
    });

    await expect(verifySessionJwt("not-a-jwt", SECRET)).resolves.toBeNull();
    await expect(verifySessionJwt(`${valid}tamper`, SECRET)).resolves.toBeNull();
    await expect(
      verifySessionJwt(valid, "different-secret-that-is-32-chars-long"),
    ).resolves.toBeNull();
    await expect(verifySessionJwt(wrongRole, SECRET)).resolves.toBeNull();
  });

  it("returns null for expired tokens or short secrets", async () => {
    const expired = await makeToken(
      { sub: "u1", email: "a@example.com", role: "user" },
      SECRET,
      "-10s",
    );
    const valid = await makeToken({
      sub: "u1",
      email: "a@example.com",
      role: "user",
    });

    await expect(verifySessionJwt(expired, SECRET)).resolves.toBeNull();
    await expect(verifySessionJwt(valid, "too-short")).resolves.toBeNull();
  });
});
