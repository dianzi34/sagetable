import { expect, test } from "@playwright/test";
import { registerAndSignIn } from "./helpers/auth";

const DEMO_CAREER_QUESTION =
  "I'm not sure I picked the right major. How do I find work I actually love?";
const PIZZA_QUESTION = "What's your favorite pizza topping?";

test.describe("Live streaming roundtable", () => {
  test("career demo question streams three answer cards, pizza question shows no-match notice, and history lists completed roundtables", async ({
    page,
  }) => {
    // 1. Sign in / Register test account
    await registerAndSignIn(page);

    // 2. /themes -> Choosing a Career
    await page.goto("/themes");
    await expect(page.getByRole("heading", { name: /choose a theme/i })).toBeVisible();

    await page.getByRole("link", { name: /choosing a career/i }).click();
    await expect(page).toHaveURL("/themes/choosing-a-career");

    // 3. Demo question chip -> submit
    const chip = page.getByRole("button", {
      name: /i'm not sure i picked the right major/i,
    }).first();
    await chip.click();

    const submitBtn = page.getByRole("button", { name: /start roundtable/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 4. Lands on /roundtable and verifies three cards stream in
    await expect(page).toHaveURL(/\/roundtable\?theme=choosing-a-career/);

    const expectedFigures = ["Mark Twain", "Marie Curie", "Vincent van Gogh"];
    for (const name of expectedFigures) {
      const card = page
        .getByRole("article")
        .filter({ has: page.getByRole("heading", { name }) });
      await expect(card).toBeVisible({ timeout: 10000 });
      await expect(
        card.getByText(`Curated interpretation in ${name}'s voice`),
      ).toBeVisible({ timeout: 15000 });
      await expect(card.getByRole("blockquote")).toBeVisible({ timeout: 15000 });
    }

    // 5. Check /history page lists this roundtable
    await page.goto("/history");
    await expect(page).toHaveURL("/history");
    await expect(page.getByRole("heading", { name: /roundtable history/i })).toBeVisible();
    await expect(page.getByText(DEMO_CAREER_QUESTION).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /view roundtable/i }).first()).toBeVisible();

    // 6. Test pizza question -> no-match notice
    await page.goto("/themes/choosing-a-career");
    const textarea = page.getByRole("textbox", { name: /your question/i });
    await textarea.fill(PIZZA_QUESTION);

    const pizzaSubmitBtn = page.getByRole("button", { name: /start roundtable/i });
    await expect(pizzaSubmitBtn).toBeEnabled();
    await pizzaSubmitBtn.click();

    await expect(page).toHaveURL(/\/roundtable\?theme=choosing-a-career/);

    for (const name of expectedFigures) {
      const card = page
        .getByRole("article")
        .filter({ has: page.getByRole("heading", { name }) });
      await expect(card).toBeVisible({ timeout: 10000 });
      await expect(
        card.getByText(`${name} hasn't written about this yet.`),
      ).toBeVisible({ timeout: 15000 });
    }
  });
});
