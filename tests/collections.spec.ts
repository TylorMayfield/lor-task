import { test, expect } from '@playwright/test';

test.describe('Collections', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // If we're on the signin page, we need to authenticate
    // For now, we'll assume we can access the dashboard directly
    // In a real scenario, you'd set up test authentication
  });

  test('should create a new collection inline', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Find and click the plus button in Collections section
    const collectionsHeader = page.locator('text=Collections').first();
    await expect(collectionsHeader).toBeVisible();
    
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();

    // Type collection name
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await expect(collectionInput).toBeVisible();
    await collectionInput.fill('Test Collection');
    await collectionInput.press('Enter');

    // Verify collection appears in sidebar
    await expect(page.locator('text=Test Collection')).toBeVisible();
  });

  test('should rename a collection by double-clicking', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create a collection first
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Collection to Rename');
    await collectionInput.press('Enter');

    // Wait for collection to appear
    await expect(page.locator('text=Collection to Rename')).toBeVisible();

    // Double-click the collection
    const collectionItem = page.locator('text=Collection to Rename');
    await collectionItem.dblclick();

    // Verify input appears
    const renameInput = page.locator('input').filter({ hasText: /Collection to Rename/ }).or(page.locator('input[value="Collection to Rename"]'));
    await expect(renameInput).toBeVisible();

    // Rename it
    await renameInput.clear();
    await renameInput.fill('Renamed Collection');
    await renameInput.press('Enter');

    // Verify new name appears
    await expect(page.locator('text=Renamed Collection')).toBeVisible();
    await expect(page.locator('text=Collection to Rename')).not.toBeVisible();
  });

  test('should show context menu on right-click', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create a collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Context Menu Test');
    await collectionInput.press('Enter');

    await expect(page.locator('text=Context Menu Test')).toBeVisible();

    // Right-click the collection
    const collectionItem = page.locator('text=Context Menu Test');
    await collectionItem.click({ button: 'right' });

    // Verify context menu appears
    await expect(page.locator('text=Rename')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
  });

  test('should delete a collection from context menu', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create a collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Collection to Delete');
    await collectionInput.press('Enter');

    await expect(page.locator('text=Collection to Delete')).toBeVisible();

    // Right-click and delete
    const collectionItem = page.locator('text=Collection to Delete');
    await collectionItem.click({ button: 'right' });
    
    await page.locator('text=Delete').click();
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(500);

    // Verify collection is removed
    await expect(page.locator('text=Collection to Delete')).not.toBeVisible();
  });

  test('should drag and drop task to collection', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create a task first
    const taskInput = page.locator('input[placeholder*="Add a task"]');
    await taskInput.fill('Task to move to collection');
    await taskInput.press('Enter');

    // Wait for task to appear
    await expect(page.locator('text=Task to move to collection')).toBeVisible();

    // Create a collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Target Collection');
    await collectionInput.press('Enter');

    await expect(page.locator('text=Target Collection')).toBeVisible();

    // Drag task to collection
    const taskCard = page.locator('text=Task to move to collection').locator('..').locator('..');
    const collectionTarget = page.locator('text=Target Collection').locator('..');
    
    await taskCard.dragTo(collectionTarget);

    // Verify task is moved (check if it appears in collection view)
    await collectionTarget.click();
    await page.waitForLoadState('networkidle');
    
    // Task should be in the collection view
    await expect(page.locator('text=Task to move to collection')).toBeVisible();
  });

  test('should create nested collections by drag and drop', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create parent collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    let collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Parent Collection');
    await collectionInput.press('Enter');

    await expect(page.locator('text=Parent Collection')).toBeVisible();

    // Create child collection
    await plusButton.click();
    collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Child Collection');
    await collectionInput.press('Enter');

    await expect(page.locator('text=Child Collection')).toBeVisible();

    // Drag child onto parent
    const childCollection = page.locator('text=Child Collection').locator('..');
    const parentCollection = page.locator('text=Parent Collection').locator('..');
    
    await childCollection.dragTo(parentCollection);
    await page.waitForTimeout(1000);

    // Verify child is nested (should be indented)
    const nestedChild = page.locator('text=Child Collection');
    await expect(nestedChild).toBeVisible();
    
    // Check if it's indented (has margin-left style)
    const childElement = nestedChild.locator('..').locator('..');
    const style = await childElement.evaluate((el) => window.getComputedStyle(el).marginLeft);
    expect(parseInt(style) || 0).toBeGreaterThan(0);
  });

  test('should move collection to root via drag and drop', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create parent and child collections
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    
    await plusButton.click();
    let collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Parent');
    await collectionInput.press('Enter');

    await plusButton.click();
    collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Child');
    await collectionInput.press('Enter');

    // Nest child under parent
    const childCollection = page.locator('text=Child').locator('..');
    const parentCollection = page.locator('text=Parent').locator('..');
    await childCollection.dragTo(parentCollection);
    await page.waitForTimeout(1000);

    // Now drag child to root (empty space in collections area)
    const collectionsContainer = collectionsHeader.locator('..').locator('..').locator('div').filter({ hasText: /Parent|Child/ }).first();
    await childCollection.dragTo(collectionsContainer, { targetPosition: { x: 10, y: 10 } });
    await page.waitForTimeout(1000);

    // Verify child is no longer nested
    const childAfterMove = page.locator('text=Child');
    await expect(childAfterMove).toBeVisible();
    
    // Check if it's at root level (no or minimal margin)
    const childElement = childAfterMove.locator('..').locator('..');
    const style = await childElement.evaluate((el) => window.getComputedStyle(el).marginLeft);
    expect(parseInt(style) || 0).toBeLessThan(20);
  });

  test('should show "Move to root" option in context menu for nested collections', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create parent and child
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    
    await plusButton.click();
    let collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Parent');
    await collectionInput.press('Enter');

    await plusButton.click();
    collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('Nested Child');
    await collectionInput.press('Enter');

    // Nest child
    const childCollection = page.locator('text=Nested Child').locator('..');
    const parentCollection = page.locator('text=Parent').locator('..');
    await childCollection.dragTo(parentCollection);
    await page.waitForTimeout(1000);

    // Right-click nested child
    const nestedChild = page.locator('text=Nested Child');
    await nestedChild.click({ button: 'right' });

    // Verify "Move to root" option appears
    await expect(page.locator('text=Move to root')).toBeVisible();
  });

  test('should navigate to collection view when clicking collection', async ({ page }) => {
    await page.goto('/dashboard/today');
    await page.waitForLoadState('networkidle');

    // Create collection
    const collectionsHeader = page.locator('text=Collections').first();
    const plusButton = collectionsHeader.locator('..').locator('button').last();
    await plusButton.click();
    
    const collectionInput = page.locator('input[placeholder*="Collection name"]');
    await collectionInput.fill('My Collection');
    await collectionInput.press('Enter');

    // Click on collection
    await page.locator('text=My Collection').click();
    await page.waitForLoadState('networkidle');

    // Verify URL changed
    await expect(page).toHaveURL(/\/dashboard\/collection\//);
    
    // Verify collection name appears in header
    await expect(page.locator('h1:has-text("My Collection")')).toBeVisible();
  });
});

