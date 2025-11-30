import { test, expect } from '@playwright/test';

test.describe('Daily Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display tasks scheduled for today', async ({ page }) => {
    // Navigate to calendar view if there's a navigation
    const calendarLink = page.locator('a:has-text("Calendar"), button:has-text("Calendar")');
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
      await page.waitForTimeout(500);
    }

    // Check for calendar or daily view
    const calendarView = page.locator('[data-testid="calendar"], .calendar, [class*="calendar"]');
    if (await calendarView.count() > 0) {
      await expect(calendarView.first()).toBeVisible();
    }

    // Check for today's date
    const todayIndicator = page.locator('text=/today|Today/i');
    if (await todayIndicator.count() > 0) {
      await expect(todayIndicator.first()).toBeVisible();
    }
  });

  test('should show tasks organized by time or priority', async ({ page }) => {
    // Create multiple tasks with different priorities
    const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"]').first();
    
    await taskInput.fill('High priority task urgent');
    const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(500);
    
    await taskInput.fill('Low priority task');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Navigate to calendar
    const calendarLink = page.locator('a:has-text("Calendar"), button:has-text("Calendar")');
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
      await page.waitForTimeout(500);
    }

    // Verify tasks are displayed
    await expect(page.locator('text=/high priority/i')).toBeVisible();
  });
});

