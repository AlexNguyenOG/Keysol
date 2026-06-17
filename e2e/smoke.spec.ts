import { expect, test } from "@playwright/test";
import { mockAvailabilityResponse } from "./fixtures/availability";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/availability**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        mockAvailabilityResponse({
          "corsair-k70-max": "out_of_stock",
          "ducky-one-3-mini-sf": "limited",
        }),
      ),
    });
  });
});

test.describe("home page", () => {
  test("renders hero, brands, and rankings preview", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /best keyboards/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /top rankings/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /top keyboard brands/i })).toBeVisible();

    const brands = page.locator("#brands");
    await expect(brands.getByRole("heading", { name: "Wooting", exact: true })).toBeVisible();
    await expect(
      brands.getByRole("heading", { name: "Corsair K70 MAX" }),
    ).toBeVisible();
    await expect(
      brands.getByRole("heading", { name: "K70 RGB PRO" }),
    ).toBeVisible();
    await expect(
      brands.getByRole("heading", { name: "K70 RGB MK.2" }),
    ).toBeVisible();
  });

  test("navigates to rankings from hero", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "View Rankings" }).first().click();

    await expect(page).toHaveURL("/rankings");
    await expect(
      page.getByRole("heading", { name: /keyboard rankings/i }),
    ).toBeVisible();
  });
});

test.describe("rankings page", () => {
  test("shows methodology and full leaderboard", async ({ page }) => {
    await page.goto("/rankings");

    await expect(
      page.getByRole("heading", { name: /how speed scores work/i }),
    ).toBeVisible();
    await expect(page.getByText("Score breakdown").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Wooting 60HE+" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "G Pro X TKL Lightspeed" }).first(),
    ).toBeVisible();
  });

  test("sort control reorders by price", async ({ page }) => {
    await page.goto("/rankings");

    await page.locator("#rankings-sort").selectOption("price-asc");

    const firstRow = page.locator("article").first();
    await expect(
      firstRow.getByRole("heading", { name: "Keychron K2 HE" }),
    ).toBeVisible();
  });

  test("each keyboard has a buy link", async ({ page }) => {
    await page.goto("/rankings");

    const buyLinks = page.getByRole("link", { name: /^(Buy |Check store — )/ });
    await expect(buyLinks).toHaveCount(18);

    await expect(buyLinks.first()).toHaveAttribute("href", /^https:\/\//);
    await expect(buyLinks.first()).toHaveAttribute("target", "_blank");
  });

  test("shows availability status badges", async ({ page }) => {
    await page.goto("/rankings");

    await expect(page.getByText("In stock").first()).toBeVisible();
    await expect(page.getByText("Out of stock")).toBeVisible();
    await expect(page.getByText("Limited stock")).toBeVisible();
  });
});
