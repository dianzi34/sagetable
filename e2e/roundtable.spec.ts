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
      await expect(card.getByRole("blockquote")).toHaveCount(1);
    }

    const twainCard = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Mark Twain" }) });
    await twainCard
      .getByRole("button", { name: "Show 1 more passage" })
      .click();
    await expect(twainCard.getByRole("blockquote")).toHaveCount(2);

    await expect(
      page.getByText(
        "No-match example (when no curated answer passes the match threshold):",
      ),
    ).toBeVisible();

    const kellerCard = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Helen Keller" }) });
    await expect(kellerCard).toBeVisible();
    await expect(
      kellerCard.getByText("Helen Keller hasn't written about this yet."),
    ).toBeVisible();
    await expect(kellerCard.getByRole("blockquote")).toHaveCount(0);
    await expect(
      kellerCard.getByText(/Curated interpretation/i),
    ).toHaveCount(0);
    await expect(kellerCard.getByRole("button", { name: /flag/i })).toHaveCount(
      0,
    );
  });
});
