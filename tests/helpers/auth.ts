import { Page } from '@playwright/test';

/**
 * Authenticate a user for testing
 * Uses the credentials provider which accepts any email/password
 */
export async function authenticateUser(page: Page, email?: string, password: string = 'test123') {
  // Generate unique email if not provided
  const userEmail = email || `test-${Date.now()}-${Math.random()}@example.com`;
  
  // Navigate to sign in page
  await page.goto('/auth/signin');
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  const emailInput = page.locator('input[type=email]').first();
  const passwordInput = page.locator('input[type=password]').first();
  
  await emailInput.fill(userEmail);
  await passwordInput.fill(password);

  // Submit the form - use the submit button in the form, not the Google button
  const submitButton = page.locator('form').locator('button[type=submit]').first();
  
  // Wait for button to be visible
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Click submit and wait for navigation
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => null),
    submitButton.click(),
  ]);
  
  // Wait a moment for any redirects
  await page.waitForTimeout(2000);
  
  // Check if we're on dashboard
  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard')) {
    // Check for error
    if (currentUrl.includes('/api/auth/error')) {
      // Retry with different email
      const newEmail = `test-${Date.now()}-${Math.random()}@example.com`;
      await page.goto('/auth/signin');
      await page.waitForLoadState('networkidle');
      const retryEmailInput = page.locator('input[type=email]').first();
      const retryPasswordInput = page.locator('input[type=password]').first();
      const retrySubmitButton = page.locator('form').locator('button[type=submit]').first();
      
      await retryEmailInput.fill(newEmail);
      await retryPasswordInput.fill(password);
      await Promise.all([
        page.waitForURL(/\/dashboard/, { timeout: 20000 }),
        retrySubmitButton.click(),
      ]);
    } else {
      // Try navigating directly to dashboard - might already be authenticated
      await page.goto('/dashboard/today');
      await page.waitForLoadState('networkidle');
      
      // Check if we're actually authenticated
      const isAuth = await isAuthenticated(page);
      if (!isAuth) {
        throw new Error(`Authentication failed. Current URL: ${currentUrl}`);
      }
    }
  }
  
  await page.waitForLoadState('networkidle');
}

/**
 * Check if user is authenticated by checking for dashboard elements
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check if we're on the dashboard or if sign-in form is visible
    const signInForm = page.locator('form').filter({ hasText: /sign in|email|password/i });
    const dashboard = page.locator('text=/my day|inbox|all tasks/i').or(page.locator('[data-testid=dashboard]'));
    
    const signInVisible = await signInForm.isVisible().catch(() => false);
    const dashboardVisible = await dashboard.isVisible().catch(() => false);
    
    return dashboardVisible && !signInVisible;
  } catch {
    return false;
  }
}

/**
 * Ensure user is authenticated, authenticate if not
 */
export async function ensureAuthenticated(page: Page, email?: string, password: string = 'test123') {
  const authenticated = await isAuthenticated(page);
  if (!authenticated) {
    // Use unique email if not provided
    const uniqueEmail = email || `test-${Date.now()}-${Math.random()}@example.com`;
    await authenticateUser(page, uniqueEmail, password);
  }
}
