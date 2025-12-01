import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers/auth';
import { createTask } from './helpers/tasks';

test.describe('Collections - Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');
  });

  test('should create a collection', async ({ page }) => {
    // Find Collections section in sidebar
    const collectionsHeader = page.locator('text=Collections').first();
    
    // Wait for sidebar to be visible
    await expect(collectionsHeader).toBeVisible({ timeout: 5000 });
    
    // Find the plus button next to Collections
    const collectionsSection = collectionsHeader.locator('..').locator('..');
    const plusButton = collectionsSection.locator('button').filter({ has: page.locator('svg') }).last();
    
    if (await plusButton.isVisible()) {
      await plusButton.click();
      
      // Type collection name
      const collectionInput = page.locator('input[placeholder*="Collection"], input[placeholder*="name"]').first();
      await expect(collectionInput).toBeVisible({ timeout: 2000 });
      
      const collectionName = 'Test Collection ' + Date.now();
      await collectionInput.fill(collectionName);
      await collectionInput.press('Enter');
      
      // Wait for collection to appear
      await page.waitForTimeout(1000);
      
      // Verify collection appears
      await expect(page.locator(`text=${collectionName}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to collection view', async ({ page }) => {
    // First create a collection
    const collectionsHeader = page.locator('text=Collections').first();
    await expect(collectionsHeader).toBeVisible({ timeout: 5000 });
    
    const collectionsSection = collectionsHeader.locator('..').locator('..');
    const plusButton = collectionsSection.locator('button').filter({ has: page.locator('svg') }).last();
    
    if (await plusButton.isVisible()) {
      await plusButton.click();
      const collectionInput = page.locator('input[placeholder*="Collection"], input[placeholder*="name"]').first();
      await collectionInput.fill('Navigation Test Collection');
      await collectionInput.press('Enter');
      await page.waitForTimeout(1000);
      
      // Click on the collection
      const collectionLink = page.locator('text=Navigation Test Collection').first();
      await collectionLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify URL changed
      await expect(page).toHaveURL(/\/dashboard\/collection\//, { timeout: 5000 });
    }
  });
});

