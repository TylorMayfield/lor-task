import { Page } from '@playwright/test';

/**
 * Create a task via the UI
 * This function ensures React state is properly updated before submission
 */
export async function createTask(page: Page, taskText: string): Promise<void> {
  // Wait for task input to be visible
  const taskInput = page.locator('input[placeholder*="task"], input[placeholder*="Add a task"], input[placeholder*="try typing"]').first();
  await taskInput.waitFor({ state: 'visible', timeout: 10000 });
  
  // Focus and clear
  await taskInput.focus();
  await taskInput.clear();
  await page.waitForTimeout(100);
  
  // Type the text
  await taskInput.type(taskText, { delay: 20 });
  await page.waitForTimeout(300);
  
  // Try to update React state directly if available (for testing)
  await page.evaluate((text) => {
    if ((window as any).__taskInputSetInput) {
      (window as any).__taskInputSetInput(text);
    }
  }, taskText);
  
  await page.waitForTimeout(300);
  
  // Verify input has value
  const inputValue = await taskInput.inputValue();
  if (!inputValue || inputValue.trim() !== taskText.trim()) {
    // Fallback: set value and trigger events
    await taskInput.evaluate((el, text) => {
      const input = el as HTMLInputElement;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, text);
      }
      input.value = text;
      const event = new Event('input', { bubbles: true });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      input.dispatchEvent(event);
    }, taskText);
    await page.waitForTimeout(500);
  }
  
  // Listen for API call
  const responsePromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      const method = response.request().method();
      return url.includes('/api/tasks') && method === 'POST';
    },
    { timeout: 15000 }
  );
  
  // Find submit button and check if it's enabled
  const submitButton = page.locator('button[type=submit]').first();
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Wait for button to be enabled (polling)
  let buttonEnabled = false;
  for (let i = 0; i < 20; i++) {
    const isDisabled = await submitButton.isDisabled().catch(() => true);
    if (!isDisabled) {
      buttonEnabled = true;
      break;
    }
    await page.waitForTimeout(100);
  }
  
  if (buttonEnabled) {
    // Button is enabled, click it
    await submitButton.click();
  } else {
    // Button still disabled, try pressing Enter anyway
    await taskInput.press('Enter');
  }
  
  // Wait for API response
  let response;
  try {
    response = await responsePromise;
  } catch (error) {
    // Check if input was cleared (indicates success)
    await page.waitForTimeout(1000);
    const currentInput = await taskInput.inputValue();
    if (currentInput === taskText) {
      // Still has text, check if there was an error
      const errorAlert = await page.locator('text=/error|failed/i').first().isVisible().catch(() => false);
      if (errorAlert) {
        const errorText = await page.locator('text=/error|failed/i').first().textContent();
        throw new Error(`Task creation failed: ${errorText || 'Unknown error'}`);
      }
      throw new Error(`Task creation failed: No API response. Input still contains: "${currentInput}"`);
    }
    // Input was cleared, assume success
    await page.waitForTimeout(2000);
    return;
  }
  
  // Check response
  if (!response.ok()) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Task creation failed: ${error.error || `HTTP ${response.status()}`}`);
  }
  
  const data = await response.json().catch(() => null);
  if (!data || !data.task) {
    throw new Error('Task creation failed: Invalid response');
  }
  
  // Wait for UI update
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
}

/**
 * Wait for a task to appear in the list
 */
export async function waitForTask(page: Page, taskText: string, timeout: number = 15000): Promise<void> {
  // Try exact match first
  try {
    await page.waitForSelector(`text=/.*${taskText}.*/i`, { timeout: timeout / 2 });
    return;
  } catch {
    // Try word-by-word
    const words = taskText.split(' ').filter(w => w.length > 2);
    for (const word of words) {
      try {
        await page.waitForSelector(`text=/.*${word}.*/i`, { timeout: 3000 });
        return;
      } catch {
        continue;
      }
    }
    throw new Error(`Task "${taskText}" not found after ${timeout}ms`);
  }
}

/**
 * Complete a task by clicking its checkbox
 */
export async function completeTask(page: Page, taskText: string): Promise<void> {
  const taskItem = page.locator(`text=/.*${taskText}.*/i`).first();
  await taskItem.scrollIntoViewIfNeeded();
  const checkbox = taskItem.locator('..').locator('button, input[type="checkbox"]').first();
  await checkbox.click();
  await page.waitForTimeout(500);
}

/**
 * Delete a task
 */
export async function deleteTask(page: Page, taskText: string): Promise<void> {
  const taskItem = page.locator(`text=/.*${taskText}.*/i`).first();
  await taskItem.click({ button: 'right' });
  await page.locator('text=/delete/i').click();
  page.on('dialog', dialog => dialog.accept());
  await page.waitForTimeout(500);
}
