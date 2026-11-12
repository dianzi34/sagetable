import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes a password so it is never stored in plain text", async () => {
    const plain = "curious-roundtable-99";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true);
    expect(hash.length).toBeGreaterThan(30);
  });

  it("verifies matching passwords and rejects incorrect passwords", async () => {
    const hash = await hashPassword("correct-horse-battery");

    await expect(verifyPassword("correct-horse-battery", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong-password-123", hash)).resolves.toBe(
      false,
    );
  });
});
