import { test, expect } from "@playwright/test";
import { createE2ESeed, createSessionCookie, destroyE2ESeed, type E2ESeed } from "./e2e-seed";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";

test.describe.serial("explore smoke", () => {
  let seed: E2ESeed;

  test.beforeAll(async () => {
    seed = await createE2ESeed();
  });

  test.afterAll(async () => {
    await destroyE2ESeed(seed);
  });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([createSessionCookie(seed, baseURL)]);
  });

  test("home redirects to feed", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole("heading", { name: "Social Itinerary Feed" })).toBeVisible();
  });

  test("feed loads and supports load more", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("heading", { name: "Social Itinerary Feed" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Load More Trips" })).toBeVisible();

    const firstPageResponse = await page.request.get("/api/feed?source=FOR_YOU");
    expect(firstPageResponse.ok()).toBeTruthy();
    const firstPage = (await firstPageResponse.json()) as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
    };

    expect(firstPage.items.length).toBeGreaterThan(0);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPageResponse = await page.request.get(
      `/api/feed?source=FOR_YOU&cursor=${encodeURIComponent(firstPage.nextCursor as string)}`
    );
    expect(secondPageResponse.ok()).toBeTruthy();
    const secondPage = (await secondPageResponse.json()) as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
    };

    expect(secondPage.items.length).toBeGreaterThan(0);
    const firstIds = new Set(firstPage.items.map((item) => item.id));
    expect(secondPage.items.some((item) => !firstIds.has(item.id))).toBeTruthy();
  });

  test("like and save endpoints return success for authenticated session", async ({ page }) => {
    const authHeaders = {
      Cookie: `next-auth.session-token=${seed.sessionToken}; __Secure-next-auth.session-token=${seed.sessionToken}`
    };

    const likeOn = await page.request.post(`/api/posts/${seed.primaryPostId}/like`, { headers: authHeaders });
    if (!likeOn.ok()) {
      throw new Error(`likeOn failed: ${likeOn.status()} ${await likeOn.text()}`);
    }
    await expect(likeOn.json()).resolves.toMatchObject({ liked: true });

    const likeOff = await page.request.post(`/api/posts/${seed.primaryPostId}/like`, { headers: authHeaders });
    expect(likeOff.ok()).toBeTruthy();
    await expect(likeOff.json()).resolves.toMatchObject({ liked: false });

    const saveOn = await page.request.post(`/api/posts/${seed.primaryPostId}/save`, { headers: authHeaders });
    expect(saveOn.ok()).toBeTruthy();
    await expect(saveOn.json()).resolves.toMatchObject({ saved: true });

    const saveOff = await page.request.post(`/api/posts/${seed.primaryPostId}/save`, { headers: authHeaders });
    expect(saveOff.ok()).toBeTruthy();
    await expect(saveOff.json()).resolves.toMatchObject({ saved: false });
  });
});
