import { expect, test } from "@playwright/test";

test.describe("Theme selection and figure picking", () => {
  test("home -> /themes -> pick theme -> pick 3 figures -> chip fills question -> submit lands on /roundtable", async ({
    page,
  }) => {
    // 1. home
    await page.goto("/");
    await page
      .getByRole("link", { name: "Bring a question to the table" })
      .click();

    // 2. /themes
    await expect(page).toHaveURL("/themes");
    await expect(
      page.getByRole("heading", { name: /choose a theme/i }),
    ).toBeVisible();

    // 3. pick theme
    await page.getByRole("link", { name: /choosing a career/i }).click();
    await expect(page).toHaveURL("/themes/choosing-a-career");

    // 4. pick 3 figures
    const twainBtn = page.getByRole("button", { name: /mark twain/i });
    await expect(twainBtn).toBeVisible();

    // 5. chip fills question
    const chip = page
      .getByRole("button", {
        name: /i'm not sure i picked the right major/i,
      })
      .first();
    await chip.click();

    const textarea = page.getByRole("textbox", { name: /your question/i });
    await expect(textarea).toHaveValue(/i'm not sure i picked the right major/i);

    // 6. submit lands on /roundtable
    const submitBtn = page.getByRole("button", { name: /start roundtable/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page).toHaveURL(/\/roundtable\?theme=choosing-a-career/);
  });
});
