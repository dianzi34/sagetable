import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function registerAndSignIn(
  page: Page,
): Promise<{ email: string }> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@sagetable.test`;
  const password = "curious-roundtable-99";

  await page.goto("/register");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL("/", { timeout: 30000 });
  return { email };
}
