import { test, expect } from '@playwright/test';

test.describe('Directory Flows', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for the main hero heading
    await expect(page.getByRole('heading', { name: /Discover the Best Spots/i })).toBeVisible();
    
    // Check that categories section is present
    await expect(page.getByText('Or browse the highlights')).toBeVisible();
    
    // Check that featured businesses are present
    await expect(page.getByRole('heading', { name: /Featured Destinations/i })).toBeVisible();
  });

  test('Navigation links work', async ({ page }) => {
    await page.goto('/');
    
    // Verify header navigation
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: /Explore/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Blog/i })).toBeVisible();
    
    // Click on Log in and verify navigation
    await header.getByRole('link', { name: /Log in/i }).click();
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  });
});
