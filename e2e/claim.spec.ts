import { test, expect } from '@playwright/test';

test.describe('Claim Flows', () => {
  test('Search for unclaimed business', async ({ page }) => {
    await page.goto('/claim');
    
    // Check page title/heading
    await expect(page.getByRole('heading', { name: 'Claim Your Business' })).toBeVisible();
    
    // Find the search input
    const searchInput = page.getByPlaceholder('Enter your business name...');
    await expect(searchInput).toBeVisible();
    
    // Search for a business (since we don't have seeded data, we test typing and checking for either results or "not found")
    await searchInput.fill('Test Business');
    
    // Wait a bit for the debounced search to trigger
    await page.waitForTimeout(1000);
    
    // It should either show a link to claim or a not found message
    const noResults = page.getByText(/No unclaimed businesses found matching/i);
    const resultsContainer = page.locator('a[href^="/claim/"]');
    
    // Since we don't know the DB state, just expect one of them to be visible
    await expect(noResults.or(resultsContainer.first())).toBeVisible({ timeout: 10000 });
  });
});
