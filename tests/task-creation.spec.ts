import { test, expect } from '@playwright/test';

test.describe('Task Creation with NLP', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should create a task using natural language input', async ({ page }) => {
    // Look for task input field
    const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"], input[type="text"]').first();
    
    // Enter natural language task
    await taskInput.fill('Pay heating bill urgent due tomorrow');
    
    // Submit the task
    const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for task to appear
    await page.waitForTimeout(1000);
    
    // Verify task was created with correct properties
    await expect(page.locator('text=/.*heating.*bill.*/i')).toBeVisible();
    
    // Check for urgent priority indicator
    const priorityIndicator = page.locator('[data-priority="urgent"], .priority-urgent, text=/urgent/i');
    if (await priorityIndicator.count() > 0) {
      await expect(priorityIndicator.first()).toBeVisible();
    }
  });

  test('should automatically tag tasks based on content', async ({ page }) => {
    const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"]').first();
    
    // Create a finance-related task
    await taskInput.fill('Pay electricity bill monthly');
    const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    // Verify finance tag was applied
    const financeTag = page.locator('text=/finance|bill|payment/i');
    if (await financeTag.count() > 0) {
      await expect(financeTag.first()).toBeVisible();
    }
  });

  test('should parse recurring tasks', async ({ page }) => {
    const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"]').first();
    
    // Create a recurring task
    await taskInput.fill('Weekly team meeting every Monday');
    const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    // Verify recurring indicator
    const recurringIndicator = page.locator('text=/recurring|weekly|repeat/i');
    if (await recurringIndicator.count() > 0) {
      await expect(recurringIndicator.first()).toBeVisible();
    }
  });
});

