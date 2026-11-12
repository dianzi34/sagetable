import { expect, test } from "@playwright/test";

test.describe("Deployment smoke checks", () => {
  test("GET /api/health returns ok without requiring external AI keys", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { status: "ok" },
    });
  });

  test("primary routes render with zero uncaught page errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Bring a question to the table" }),
    ).toBeVisible();

    await page.goto("/roundtable");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });
});
