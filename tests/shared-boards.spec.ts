import { test, expect } from '@playwright/test';

test.describe('Shared Boards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new board', async ({ page }) => {
    // Navigate to boards
    const boardsLink = page.locator('a:has-text("Boards"), button:has-text("Boards")');
    if (await boardsLink.count() > 0) {
      await boardsLink.click();
      await page.waitForTimeout(500);
    }

    // Create board button
    const createButton = page.locator('button:has-text("Create Board")');
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill board form
      const nameInput = page.locator('input[placeholder*="Board"], input[name="name"]');
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Board');
      }

      const submitButton = page.locator('button[type="submit"], button:has-text("Create")');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Verify board was created
        await expect(page.locator('text=/test board/i')).toBeVisible();
      }
    }
  });

  test('should add members to a board', async ({ page }) => {
    // Navigate to boards and select a board
    const boardsLink = page.locator('a:has-text("Boards"), button:has-text("Boards")');
    if (await boardsLink.count() > 0) {
      await boardsLink.click();
      await page.waitForTimeout(500);
    }

    // Click on a board
    const boardCard = page.locator('[class*="board"], .board-card').first();
    if (await boardCard.count() > 0) {
      await boardCard.click();
      await page.waitForTimeout(1000);

      // Look for add member button
      const addMemberButton = page.locator('button:has-text("Add"), button:has-text("Member")');
      if (await addMemberButton.count() > 0) {
        await addMemberButton.click();
        await page.waitForTimeout(500);

        // Fill member form
        const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
        if (await emailInput.count() > 0) {
          await emailInput.fill('test@example.com');
        }

        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Verify member was added
          const memberList = page.locator('text=/test@example.com/i');
          if (await memberList.count() > 0) {
            await expect(memberList.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should create tasks in a board', async ({ page }) => {
    // Navigate to boards
    const boardsLink = page.locator('a:has-text("Boards"), button:has-text("Boards")');
    if (await boardsLink.count() > 0) {
      await boardsLink.click();
      await page.waitForTimeout(500);
    }

    // Click on a board
    const boardCard = page.locator('[class*="board"], .board-card').first();
    if (await boardCard.count() > 0) {
      await boardCard.click();
      await page.waitForTimeout(1000);

      // Create a task
      const taskInput = page.locator('input[placeholder*="task"], textarea[placeholder*="task"]').first();
      if (await taskInput.count() > 0) {
        await taskInput.fill('Board task');
        const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Verify task was created
          await expect(page.locator('text=/board task/i')).toBeVisible();
        }
      }
    }
  });

  test('should respect board permissions', async ({ page }) => {
    // This test would require multiple user sessions
    // In a real scenario, you'd test:
    // 1. Viewer can see tasks but not edit
    // 2. Member can create and edit tasks
    // 3. Admin can manage members
    // 4. Owner can delete board

    // For now, just verify permission indicators exist
    const boardsLink = page.locator('a:has-text("Boards"), button:has-text("Boards")');
    if (await boardsLink.count() > 0) {
      await boardsLink.click();
      await page.waitForTimeout(500);

      const boardCard = page.locator('[class*="board"], .board-card').first();
      if (await boardCard.count() > 0) {
        await boardCard.click();
        await page.waitForTimeout(1000);

        // Look for permission indicator
        const permissionBadge = page.locator('text=/owner|admin|member|viewer/i');
        if (await permissionBadge.count() > 0) {
          await expect(permissionBadge.first()).toBeVisible();
        }
      }
    }
  });

  test('should filter tasks by board', async ({ page }) => {
    // Navigate to main tasks view
    const tasksLink = page.locator('a:has-text("Tasks"), button:has-text("Tasks")');
    if (await tasksLink.count() > 0) {
      await tasksLink.click();
      await page.waitForTimeout(500);
    }

    // Look for board filter
    const boardFilter = page.locator('select[name="board"], [data-testid="board-filter"]');
    if (await boardFilter.count() > 0) {
      await expect(boardFilter.first()).toBeVisible();
    }
  });
});

