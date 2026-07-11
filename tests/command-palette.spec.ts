import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 667 } });

test.describe("Command Palette Keyboard Accessibility", () => {
  test("opens palette with Cmd+K, searches, and navigates without mouse", async ({
    page,
  }) => {
    const isMac = process.platform === "darwin";
    // 1. Navigate to dashboard
    await page.goto("/");

    // 2. Press Cmd+K or Ctrl+K
    if (isMac) {
      await page.keyboard.press("Meta+K");
    } else {
      await page.keyboard.press("Control+K");
    }

    // 3. Wait for the command palette to be visible
    const commandDialog = page.locator("[role='dialog']");
    await expect(commandDialog).toBeVisible();

    // 4. Type a contract title query
    await page.keyboard.type("Test Contract");

    // 5. Wait for results to load (assuming 'Searching...' disappears and results appear)
    // In our implementation, a mock backend search might take ~300ms + API time.
    // The CommandItem role is 'option'.
    await expect(
      page.getByRole("option", { name: /Test Contract/i }).first(),
    ).toBeVisible({ timeout: 5000 });

    // 6. Press ArrowDown to focus the first contract item.
    // The CommandInput focuses by default. Hitting arrow down selects the first item.
    await page.keyboard.press("ArrowDown");

    // Wait a short tick for selection state
    await page.waitForTimeout(100);

    // 7. Press Enter to select
    await page.keyboard.press("Enter");

    // 8. Assert navigation to contract detail page
    await expect(page).toHaveURL(/\/contracts\/[a-zA-Z0-9-]+/);
  });
});
