import { expect, test } from "@playwright/test";

const DEMO_QUESTION =
  "I'm not sure I picked the right major. How do I find work I actually love?";

test.describe("Roundtable page", () => {
  test("shows the demo question, three answer cards, and the Helen Keller no-match notice", async ({
    page,
  }) => {
    await page.goto("/roundtable");

    await expect(
      page.getByRole("heading", { name: DEMO_QUESTION }),
    ).toBeVisible();

    for (const name of ["Mark Twain", "Marie Curie", "Vincent van Gogh"]) {
      const card = page
        .getByRole("article")
        .filter({ has: page.getByRole("heading", { name }) });
      await expect(card).toBeVisible();
      await expect(
        card.getByText(`Curated interpretation in ${name}'s voice`),
      ).toBeVisible();
      await expect(card.getByRole("blockquote").first()).toBeVisible();
    }

    const kellerCard = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Helen Keller" }) });
    await expect(kellerCard).toBeVisible();
    await expect(
      kellerCard.getByText("Helen Keller hasn't written about this yet."),
    ).toBeVisible();
    await expect(kellerCard.getByRole("blockquote")).toHaveCount(0);
  });
});
