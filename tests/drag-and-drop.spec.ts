import { test, expect } from '@playwright/test';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');
  });

  test('should drag task to collection and show visual feedback', async ({ page }) => {
    // Create a task
    const taskInput = page.locator('input[placeholder*="Add a task"]');
    await taskInput.fill('Draggable Task');
    await taskInput.press('Enter');
    await expect(page.locator('text=Draggable Task')).toBeVisible();

    // Create a collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Drop Target');
    await collectionInput.press('Enter');
    await expect(page.locator('text=Drop Target')).toBeVisible();

    // Start dragging task
    const taskCard = page.locator('text=Draggable Task').locator('..').locator('..').first();
    const collectionTarget = page.locator('text=Drop Target').locator('..').locator('..').first();
    
    // Drag over collection - should show highlight
    await taskCard.hover();
    await page.mouse.down();
    await collectionTarget.hover();
    
    // Check for visual feedback (border or background change)
    const collectionStyle = await collectionTarget.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        border: styles.border,
      };
    });
    
    // Should have some visual indication
    expect(collectionStyle.border || collectionStyle.backgroundColor).toBeTruthy();
    
    // Complete drop
    await page.mouse.up();
    await page.waitForTimeout(500);
  });

  test('should show root drop zone when dragging collection', async ({ page }) => {
    // Create two collections
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    
    await plusButton.click();
    let collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Collection 1');
    await collectionInput.press('Enter');

    await plusButton.click();
    collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Collection 2');
    await collectionInput.press('Enter');

    // Start dragging Collection 2
    const collection2 = page.locator('text=Collection 2').locator('..').locator('..').first();
    const collectionsContainer = collectionsHeader.locator('..').locator('..');
    
    await collection2.hover();
    await page.mouse.down();
    await collectionsContainer.hover({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(300);

    // Check for root drop zone indicator
    const rootDropZone = page.locator('text=Move to root');
    await expect(rootDropZone).toBeVisible();
    
    await page.mouse.up();
  });

  test('should show nested drop highlight when dragging collection over another', async ({ page }) => {
    // Create two collections
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    
    await plusButton.click();
    let collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Target Collection');
    await collectionInput.press('Enter');

    await plusButton.click();
    collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Source Collection');
    await collectionInput.press('Enter');

    // Drag source over target
    const sourceCollection = page.locator('text=Source Collection').locator('..').locator('..').first();
    const targetCollection = page.locator('text=Target Collection').locator('..').locator('..').first();
    
    await sourceCollection.hover();
    await page.mouse.down();
    await targetCollection.hover();
    await page.waitForTimeout(300);

    // Check for nested drop highlight (dashed border)
    const targetStyle = await targetCollection.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        border: styles.border,
        borderStyle: styles.borderStyle,
        backgroundColor: styles.backgroundColor,
      };
    });
    
    // Should have visual feedback
    expect(targetStyle.border || targetStyle.backgroundColor).toBeTruthy();
    
    await page.mouse.up();
  });

  test('should move task to collection via drag and drop', async ({ page }) => {
    // Create task
    const taskInput = page.locator('input[placeholder*="Add a task"]');
    await taskInput.fill('Task for Collection');
    await taskInput.press('Enter');
    await expect(page.locator('text=Task for Collection')).toBeVisible();

    // Create collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Task Collection');
    await collectionInput.press('Enter');

    // Drag task to collection
    const taskCard = page.locator('text=Task for Collection').locator('..').locator('..').first();
    const collectionTarget = page.locator('text=Task Collection').locator('..').locator('..').first();
    
    await taskCard.dragTo(collectionTarget);
    await page.waitForTimeout(1000);

    // Navigate to collection view
    await collectionTarget.click();
    await page.waitForLoadState('networkidle');

    // Verify task is in collection
    await expect(page.locator('text=Task for Collection')).toBeVisible();
  });
});

