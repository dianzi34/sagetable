import { expect, test } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("redirects unauthenticated visitors opening roundtables or the notebook to sign-in", async ({
    page,
  }) => {
    await page.goto("/notebook");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fnotebook/);
    await expect(
      page.getByRole("heading", { name: /sign in to sagetable/i }),
    ).toBeVisible();

    await page.goto("/roundtable/demo-session");
    await expect(page).toHaveURL(
      /\/sign-in\?callbackUrl=%2Froundtable%2Fdemo-session/,
    );
  });

  test("allows registering, signing out, and signing back in with an httpOnly session cookie", async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@sagetable.test`;
    const password = "curious-roundtable-99";

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /create your sagetable account/i }),
    ).toBeVisible();

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation").getByText(email)).toBeVisible();

    const meSignedIn = await page.request.get("/api/auth/me");
    expect(meSignedIn.status()).toBe(200);
    await expect(meSignedIn.json()).resolves.toMatchObject({
      data: { user: { email, role: "user" } },
    });

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL("/sign-in");

    const meSignedOut = await page.request.get("/api/auth/me");
    expect(meSignedOut.status()).toBe(401);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation").getByText(email)).toBeVisible();
  });
});
