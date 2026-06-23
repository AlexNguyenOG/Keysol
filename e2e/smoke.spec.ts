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
      brands.getByRole("heading", { name: "K70 RGB", exact: true }),
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
    await expect(buyLinks).toHaveCount(26);

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

test.describe("tokens page", () => {
  test("shows guide and token catalog", async ({ page }) => {
    await page.route("**/api/tokens/snapshot**", async (route) => {
      const { buildTokenSnapshots } = await import("../src/lib/tokens");
      const { mockAvailabilityFixture } = await import("./fixtures/availability");
      const availability = mockAvailabilityFixture({
        "corsair-k70-max": "out_of_stock",
      });
      const snapshots = buildTokenSnapshots(availability);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          trustModel: "server-verified-availability",
          snapshotAt: new Date().toISOString(),
          snapshots,
        }),
      });
    });

    await page.goto("/tokens");

    await expect(
      page.getByRole("heading", { name: /token guide/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /what are keysol tokens/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /how effective scores work/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /token catalog/i }),
    ).toBeVisible();
    await expect(page.getByText("KSOL-W60HE")).toBeVisible();
  });
});

test.describe("value trends page", () => {
  test("shows trend badges and keyboard list", async ({ page }) => {
    await page.route("**/api/tokens/snapshot**", async (route) => {
      const { buildTokenSnapshots } = await import("../src/lib/tokens");
      const { mockAvailabilityFixture } = await import("./fixtures/availability");
      const availability = mockAvailabilityFixture({
        "corsair-k70-max": "out_of_stock",
      });
      const snapshots = buildTokenSnapshots(availability, new Date().toISOString(), {
        "corsair-k70-max": 70,
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          trustModel: "server-verified-availability",
          snapshotAt: new Date().toISOString(),
          snapshots,
        }),
      });
    });

    await page.goto("/value-trends");

    await expect(
      page.getByRole("heading", { name: /value trends/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /how value trends work/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /keyboard value trends/i }),
    ).toBeVisible();
    await expect(page.getByText("Rising").first()).toBeVisible();
    await expect(page.getByText("Stable").first()).toBeVisible();
  });
});
