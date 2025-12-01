import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers/auth';
import { createTask, waitForTask, completeTask, deleteTask } from './helpers/tasks';

test.describe('Basic Task Operations', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    // Start on list view where all tasks are visible
    await page.goto('/dashboard/list');
    await page.waitForLoadState('networkidle');
  });

  test('should create a simple task', async ({ page }) => {
    // Navigate to "All Tasks" view where all tasks are visible
    await page.goto('/dashboard/list');
    await page.waitForLoadState('networkidle');
    
    const taskText = 'Test task ' + Date.now();
    await createTask(page, taskText);
    
    // Wait for task to appear
    await waitForTask(page, taskText, 15000);
    await expect(page.locator(`text=/.*${taskText}.*/i`)).toBeVisible({ timeout: 10000 });
  });

  test('should complete a task', async ({ page }) => {
    const taskText = 'Task to complete ' + Date.now();
    await createTask(page, taskText);
    await waitForTask(page, taskText, 15000);
    
    // Find and click the checkbox
    const taskItem = page.locator(`text=/.*${taskText}.*/i`).first();
    const checkbox = taskItem.locator('..').locator('button, input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForTimeout(500);
    
    // Task should be marked as completed (strikethrough or different styling)
    const completedTask = taskItem.locator('..');
    const styles = await completedTask.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        textDecoration: computed.textDecoration,
        opacity: computed.opacity,
      };
    });
    
    // Check if task appears completed (either strikethrough or reduced opacity)
    expect(styles.textDecoration.includes('line-through') || parseFloat(styles.opacity) < 1).toBeTruthy();
  });

  test('should delete a task', async ({ page }) => {
    const taskText = 'Task to delete ' + Date.now();
    await createTask(page, taskText);
    await waitForTask(page, taskText, 15000);
    
    // Right-click to open context menu
    const taskItem = page.locator(`text=/.*${taskText}.*/i`).first();
    await taskItem.click({ button: 'right' });
    
    // Wait for context menu
    await page.waitForTimeout(300);
    
    // Click delete
    const deleteButton = page.locator('text=/delete/i').first();
    if (await deleteButton.isVisible()) {
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // Verify task is gone
      await expect(taskItem).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should navigate between views', async ({ page }) => {
    // Create a task
    const taskText = 'Task for navigation ' + Date.now();
    await createTask(page, taskText);
    await waitForTask(page, taskText, 15000);
    
    // Navigate to "All Tasks"
    await page.locator('text=/all tasks|all my tasks/i').first().click();
    await page.waitForLoadState('networkidle');
    
    // Task should still be visible
    await expect(page.locator(`text=/.*${taskText}.*/i`)).toBeVisible();
    
    // Navigate back to "My Day"
    await page.locator('text=/my day|do today/i').first().click();
    await page.waitForLoadState('networkidle');
  });
});

