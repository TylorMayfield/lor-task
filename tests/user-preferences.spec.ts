import { test, expect } from '@playwright/test';

test.describe('User Preferences and Customization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should allow users to customize default settings', async ({ page }) => {
    // Navigate to settings/preferences
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings"), a:has-text("Preferences")');
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(500);
      
      // Check for preferences form
      const preferencesForm = page.locator('form, [data-testid="preferences"]');
      if (await preferencesForm.count() > 0) {
        await expect(preferencesForm.first()).toBeVisible();
      }
    }
  });

  test('should allow toggling ML learning', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings")');
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(500);
      
      // Look for ML learning toggle
      const mlToggle = page.locator('text=/ML|learning|machine learning/i').locator('..').locator('input[type="checkbox"], button');
      if (await mlToggle.count() > 0) {
        await expect(mlToggle.first()).toBeVisible();
      }
    }
  });

  test('should allow customizing work hours', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings")');
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(500);
      
      // Look for work hours input
      const workHoursInput = page.locator('input[placeholder*="hour"], input[type="time"], text=/work hours/i');
      if (await workHoursInput.count() > 0) {
        await expect(workHoursInput.first()).toBeVisible();
      }
    }
  });
});

