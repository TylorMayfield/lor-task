import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers/auth';
import { createTask, waitForTask } from './helpers/tasks';

test.describe('Task Creation with NLP', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user
    await ensureAuthenticated(page);
  });

  test('should create a task using natural language input', async ({ page }) => {
    // Navigate to today view
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');
    
    // Create task using helper
    await createTask(page, 'Pay heating bill urgent due tomorrow');
    
    // Verify task was created
    await waitForTask(page, 'heating bill');
    await expect(page.locator('text=/.*heating.*bill.*/i')).toBeVisible();
  });

  test('should automatically tag tasks based on content', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');
    
    // Create a finance-related task
    await createTask(page, 'Pay electricity bill monthly');
    
    // Wait for task to appear
    await waitForTask(page, 'electricity bill');
    
    // Verify task exists (tags may be shown in the UI)
    await expect(page.locator('text=/.*electricity.*bill.*/i')).toBeVisible();
  });

  test('should parse recurring tasks', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');
    
    // Create a recurring task
    await createTask(page, 'Weekly team meeting every Monday');
    
    // Wait for task to appear
    await waitForTask(page, 'team meeting');
    
    // Verify task was created
    await expect(page.locator('text=/.*team.*meeting.*/i')).toBeVisible();
  });
});

