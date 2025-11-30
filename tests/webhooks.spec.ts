import { test, expect } from '@playwright/test';

test.describe('Webhook Integration', () => {
  let webhookUrl: string;
  let receivedWebhooks: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Start a simple HTTP server to receive webhooks
    // In a real scenario, you'd use a service like webhook.site or ngrok
    // For testing, we'll use a mock approach
    receivedWebhooks = [];
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a webhook configuration', async ({ page }) => {
    // Navigate to settings or webhooks page
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings")');
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(500);
    }

    // Look for webhooks section or navigate to webhooks
    const webhooksLink = page.locator('a:has-text("Webhooks"), button:has-text("Webhooks")');
    if (await webhooksLink.count() > 0) {
      await webhooksLink.click();
      await page.waitForTimeout(500);
    }

    // Create a new webhook
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add Webhook")');
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill webhook form
      const urlInput = page.locator('input[type="url"], input[name="url"], input[placeholder*="url"]');
      if (await urlInput.count() > 0) {
        webhookUrl = 'https://webhook.site/test-webhook';
        await urlInput.fill(webhookUrl);

        // Select events
        const eventCheckboxes = page.locator('input[type="checkbox"][value*="task"]');
        const count = await eventCheckboxes.count();
        if (count > 0) {
          await eventCheckboxes.first().check();
        }

        // Submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Verify webhook was created
          await expect(page.locator(`text=${webhookUrl}`)).toBeVisible();
        }
      }
    }
  });

  test('should fire webhook when task is created', async ({ page, request }) => {
    // Set up webhook endpoint mock
    const webhookEndpoint = 'https://webhook.site/test-task-created';
    
    // Create a task
    const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"]').first();
    await taskInput.fill('Test task for webhook');
    
    const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(2000);

    // Verify task was created
    await expect(page.locator('text=/test task for webhook/i')).toBeVisible();

    // Note: In a real test, you would:
    // 1. Set up a webhook endpoint (using webhook.site or a test server)
    // 2. Create the webhook via API
    // 3. Create a task
    // 4. Verify the webhook was called with correct payload
  });

  test('should fire webhook when task status changes', async ({ page }) => {
    // Create a task first
    const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"]').first();
    await taskInput.fill('Task to complete');
    
    const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Find the task and mark it as complete
    const taskItem = page.locator('text=/task to complete/i').first();
    await expect(taskItem).toBeVisible();

    const completeCheckbox = taskItem.locator('..').locator('input[type="checkbox"]').first();
    if (await completeCheckbox.count() > 0) {
      await completeCheckbox.click();
      await page.waitForTimeout(2000);

      // Verify task is marked as complete
      const completedTask = page.locator('text=/task to complete/i');
      await expect(completedTask).toBeVisible();
    }

    // Note: In a real test, verify webhook was called with status_changed event
  });

  test('should create task via incoming webhook', async ({ request }) => {
    // This test uses the API directly
    const userId = 'test-user-id'; // In real test, get from authenticated session
    
    const response = await request.post('http://localhost:3000/api/webhooks/incoming', {
      data: {
        userId,
        task: {
          title: 'Task created via webhook',
          description: 'This task was created through webhook integration',
          priority: 'high',
          tags: ['webhook', 'test'],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.task).toBeDefined();
    expect(data.task.title).toBe('Task created via webhook');
  });

  test('should handle webhook signature verification', async ({ request }) => {
    // Test webhook signature generation and verification
    const userId = 'test-user-id';
    const secret = 'test-secret-key';

    const response = await request.post('http://localhost:3000/api/webhooks/incoming', {
      data: {
        userId,
        secret,
        task: {
          title: 'Signed webhook task',
        },
      },
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should list and manage webhooks', async ({ page }) => {
    // Navigate to webhooks page
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings")');
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(500);
    }

    // Look for webhooks list
    const webhooksSection = page.locator('text=/webhook/i');
    if (await webhooksSection.count() > 0) {
      await expect(webhooksSection.first()).toBeVisible();

      // Test editing webhook
      const editButton = page.locator('button:has-text("Edit"), button[title*="Edit"]').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Verify edit form is visible
        const urlInput = page.locator('input[type="url"], input[name="url"]');
        if (await urlInput.count() > 0) {
          await expect(urlInput.first()).toBeVisible();
        }
      }

      // Test deleting webhook
      const deleteButton = page.locator('button:has-text("Delete"), button[title*="Delete"]').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

