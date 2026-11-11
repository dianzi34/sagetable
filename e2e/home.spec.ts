import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("displays the SageTable wordmark and primary call to action", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("banner").getByText("SageTable")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Bring a question to the table" }),
    ).toBeVisible();
  });
});
