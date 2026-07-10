import { test, expect } from "@playwright/test";

test.describe("Contracts List View", () => {
  test("filters to high risk contracts and updates URL", async ({ page }) => {
    // Navigate to the contracts list
    await page.goto("/contracts");

    // Wait for the page to load
    await expect(page.locator("h1", { hasText: "Contracts" })).toBeVisible();

    // Find the Risk Level select trigger
    // Using the placeholder "Risk Level" or default "All Risk" text
    const riskTrigger = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /(Risk Level|All Risk)/ });
    await expect(riskTrigger).toBeVisible();
    await riskTrigger.click();

    // Select "High Risk" from the dropdown
    const highRiskOption = page.locator('div[role="option"]', {
      hasText: "High Risk",
    });
    await highRiskOption.click();

    // Assert the URL updates correctly
    await expect(page).toHaveURL(/.*risk=HIGH/);

    // Wait for the server component to respond and table to reflect
    // In a real app we might wait for a loading state to finish, but since we use transition, opacity might change
    await page.waitForLoadState("networkidle");

    // Assert that only high risk rows render
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    // Check if it's the empty state
    if (rowCount === 1) {
      const text = await rows.nth(0).innerText();
      if (
        text.includes("No matching contracts found") ||
        text.includes("No contracts yet")
      ) {
        return; // Valid empty state
      }
    }

    // If there are data rows, they must all contain "High Risk"
    for (let i = 0; i < rowCount; i++) {
      const rowText = await rows.nth(i).innerText();
      expect(rowText).toContain("High Risk");
    }
  });
});
