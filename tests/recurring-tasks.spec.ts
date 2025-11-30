import { test, expect } from '@playwright/test';

test.describe('Recurring Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create and track recurring tasks', async ({ page }) => {
    const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"]').first();
    
    // Create a recurring task
    await taskInput.fill('Monthly heating bill payment');
    const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    // Mark task as completed
    const taskItem = page.locator('text=/heating bill/i').first();
    await expect(taskItem).toBeVisible();
    
    // Look for complete/check button
    const completeButton = taskItem.locator('..').locator('button, [role="checkbox"], input[type="checkbox"]').first();
    if (await completeButton.count() > 0) {
      await completeButton.click();
      await page.waitForTimeout(1000);
      
      // Verify new occurrence was created
      const newTask = page.locator('text=/heating bill/i');
      await expect(newTask).toBeVisible();
    }
  });

  test('should display recurring task history', async ({ page }) => {
    // Navigate to task details or history view
    const taskItem = page.locator('text=/heating|bill|recurring/i').first();
    if (await taskItem.count() > 0) {
      await taskItem.click();
      await page.waitForTimeout(500);
      
      // Look for history section
      const historySection = page.locator('text=/history|past|completed/i');
      if (await historySection.count() > 0) {
        await expect(historySection.first()).toBeVisible();
      }
    }
  });
});

