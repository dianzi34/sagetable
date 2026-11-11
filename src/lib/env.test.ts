import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_SECRET = "a".repeat(32);

describe("env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("does not throw at import time when env vars are missing", async () => {
    vi.resetModules();
    await expect(import("./env")).resolves.toBeDefined();
  });

  it("returns DATABASE_URL and JWT_SECRET without requiring AI keys", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sagetable";
    process.env.JWT_SECRET = VALID_SECRET;

    const { getEnv } = await import("./env");

    expect(getEnv()).toEqual({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/sagetable",
      JWT_SECRET: VALID_SECRET,
    });
  });

  it("throws an error naming DATABASE_URL when DATABASE_URL is missing", async () => {
    process.env.JWT_SECRET = VALID_SECRET;

    const { getEnv } = await import("./env");

    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it("throws an error naming JWT_SECRET when JWT_SECRET is missing", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sagetable";

    const { getEnv } = await import("./env");

    expect(() => getEnv()).toThrow(/JWT_SECRET/);
  });

  it("throws an error naming JWT_SECRET when JWT_SECRET is shorter than 32 characters", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sagetable";
    process.env.JWT_SECRET = "too-short-secret";

    const { getEnv } = await import("./env");

    expect(() => getEnv()).toThrow(/JWT_SECRET/);
  });
});
