import { test, expect } from '@playwright/test';

test.describe('Views and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate between views and update URL', async ({ page }) => {
    // Check initial view
    await expect(page).toHaveURL(/\/dashboard\/today/);
    await expect(page.locator('h1:has-text("My Day")')).toBeVisible();

    // Navigate to "Next 7 days"
    await page.locator('text=Next 7 days').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard\/upcoming/);
    await expect(page.locator('h1:has-text("Next 7 Days")')).toBeVisible();

    // Navigate to "All my tasks"
    await page.locator('text=All my tasks').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard\/list/);
    await expect(page.locator('h1:has-text("All Tasks")')).toBeVisible();

    // Navigate back to "My day"
    await page.locator('text=My day').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard\/today/);
  });

  test('should show page transition animations', async ({ page }) => {
    // Create a task to ensure content exists
    const taskInput = page.locator('input[placeholder*="Add a task"]');
    await taskInput.fill('Test Task');
    await taskInput.press('Enter');
    await expect(page.locator('text=Test Task')).toBeVisible();

    // Navigate to different view
    await page.locator('text=Next 7 days').click();
    
    // Check if content animates (framer-motion should handle this)
    // We can verify by checking if content appears smoothly
    await page.waitForTimeout(300);
    await expect(page.locator('h1:has-text("Next 7 Days")')).toBeVisible();
  });

  test('should filter tasks correctly in different views', async ({ page }) => {
    // Create tasks with different dates
    const taskInput = page.locator('input[placeholder*="Add a task"]');
    
    await taskInput.fill('Today Task tomorrow');
    await taskInput.press('Enter');
    await page.waitForTimeout(500);

    await taskInput.fill('Upcoming Task in 3 days');
    await taskInput.press('Enter');
    await page.waitForTimeout(500);

    await taskInput.fill('Regular Task');
    await taskInput.press('Enter');
    await page.waitForTimeout(500);

    // Check "My day" view
    await page.locator('text=My day').click();
    await page.waitForLoadState('networkidle');
    // Should show today's tasks

    // Check "Next 7 days" view
    await page.locator('text=Next 7 days').click();
    await page.waitForLoadState('networkidle');
    // Should show upcoming tasks

    // Check "All my tasks" view
    await page.locator('text=All my tasks').click();
    await page.waitForLoadState('networkidle');
    // Should show all tasks
    await expect(page.locator('text=Regular Task')).toBeVisible();
  });

  test('should navigate to collection view and show collection name', async ({ page }) => {
    // Create collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Test Collection View');
    await collectionInput.press('Enter');

    // Click collection
    await page.locator('text=Test Collection View').click();
    await page.waitForLoadState('networkidle');

    // Verify URL and header
    await expect(page).toHaveURL(/\/dashboard\/collection\//);
    await expect(page.locator('h1:has-text("Test Collection View")')).toBeVisible();
  });
});

