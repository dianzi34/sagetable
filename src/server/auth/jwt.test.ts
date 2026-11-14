import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./jwt";

const VALID_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/sagetable";
const VALID_JWT_SECRET = "sagetable-unit-test-secret-minimum-32-bytes";

describe("server JWT helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: VALID_DATABASE_URL,
      JWT_SECRET: VALID_JWT_SECRET,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("signs and verifies session tokens carrying id, email, and role", async () => {
    for (const role of ["user", "curator", "admin"] as const) {
      const user = {
        id: `user-${role}`,
        email: `${role}@sagetable.test`,
        role,
      };
      const token = await signSessionToken(user);

      expect(token.split(".")).toHaveLength(3);
      await expect(verifySessionToken(token)).resolves.toEqual(user);
    }
  });

  it("returns null when verifying a tampered token", async () => {
    const token = await signSessionToken({
      id: "user-1",
      email: "user@sagetable.test",
      role: "user",
    });

    await expect(verifySessionToken(`${token}x`)).resolves.toBeNull();
  });

  it("throws when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(
      signSessionToken({
        id: "user-1",
        email: "user@sagetable.test",
        role: "user",
      }),
    ).rejects.toThrow(/JWT_SECRET/);
  });
});
