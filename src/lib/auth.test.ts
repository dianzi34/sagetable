import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  SESSION_COOKIE_NAME,
  getSafeCallbackUrl,
  normalizeRole,
  registerSchema,
  signInSchema,
  toPrismaRole,
} from "./auth";

describe("auth schemas and helpers", () => {
  describe("registerSchema", () => {
    it("accepts a valid email and an 8-character password while normalizing the email", () => {
      const result = registerSchema.safeParse({
        email: "  Alice@Example.COM ",
        password: "a".repeat(PASSWORD_MIN_LENGTH),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: "alice@example.com",
          password: "aaaaaaaa",
        });
      }
    });

    it("rejects an invalid email address", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "valid-password",
      });

      expect(result.success).toBe(false);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        email: "alice@example.com",
        password: "1234567",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("signInSchema", () => {
    it("accepts valid email and non-empty password while normalizing the email", () => {
      const result = signInSchema.safeParse({
        email: " Twain@SageTable.org ",
        password: "secret123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: "twain@sagetable.org",
          password: "secret123",
        });
      }
    });

    it("rejects an empty password", () => {
      const result = signInSchema.safeParse({
        email: "alice@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("normalizeRole and toPrismaRole", () => {
    it("maps database Role values and lowercase role names to user, curator, and admin", () => {
      expect(normalizeRole("USER")).toBe("user");
      expect(normalizeRole("CURATOR")).toBe("curator");
      expect(normalizeRole("ADMIN")).toBe("admin");
      expect(normalizeRole("curator")).toBe("curator");

      expect(toPrismaRole("user")).toBe("USER");
      expect(toPrismaRole("curator")).toBe("CURATOR");
      expect(toPrismaRole("admin")).toBe("ADMIN");
    });

    it("throws on unsupported roles", () => {
      expect(() => normalizeRole("superadmin")).toThrow(/role/i);
    });
  });

  describe("getSafeCallbackUrl", () => {
    it("keeps relative in-app paths and query strings", () => {
      expect(getSafeCallbackUrl("/themes")).toBe("/themes");
      expect(getSafeCallbackUrl("/roundtable/rt-123?view=cards")).toBe(
        "/roundtable/rt-123?view=cards",
      );
    });

    it("rejects external, protocol-relative, and missing callback URLs", () => {
      expect(getSafeCallbackUrl(undefined)).toBe("/");
      expect(getSafeCallbackUrl(null)).toBe("/");
      expect(getSafeCallbackUrl("")).toBe("/");
      expect(getSafeCallbackUrl("https://evil.example/steal")).toBe("/");
      expect(getSafeCallbackUrl("//evil.example/steal")).toBe("/");
      expect(getSafeCallbackUrl("/\\evil.example")).toBe("/");
      expect(getSafeCallbackUrl("/themes", "/fallback")).toBe("/themes");
    });

    it("uses the configured session cookie name", () => {
      expect(SESSION_COOKIE_NAME).toBe("sagetable_session");
    });
  });
});
