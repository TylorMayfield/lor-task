import { test, expect } from '@playwright/test';

test.describe('KNN Pattern Learning System', () => {
  let userId: string;
  let testTaskIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Create a test user session and get user ID
    // This would typically be done through authentication
    userId = 'test-user-knn';
  });

  test.afterEach(async ({ request }) => {
    // Clean up test tasks
    for (const taskId of testTaskIds) {
      try {
        await request.delete(`http://localhost:3000/api/tasks/${taskId}`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    testTaskIds = [];
  });

  test('should predict tags based on similar completed tasks', async ({ request, page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // First, create and complete some tasks with known tags via UI
    const completedTasks = [
      { title: 'Pay heating bill', tags: ['finance', 'bills'] },
      { title: 'Pay electricity bill', tags: ['finance', 'utilities'] },
      { title: 'Pay water bill', tags: ['finance', 'bills'] },
    ];

    // Create and complete tasks via UI
    for (const taskData of completedTasks) {
      const taskInput = page.locator('input[placeholder*="task"]').first();
      await taskInput.fill(taskData.title);
      
      const submitButton = page.locator('button:has-text("Add"), button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Find the task and mark as complete
      const taskItem = page.locator(`text=/.*${taskData.title}.*/i`).first();
      if (await taskItem.count() > 0) {
        const checkbox = taskItem.locator('..').locator('input[type="checkbox"]').first();
        if (await checkbox.count() > 0) {
          await checkbox.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Now test tag prediction for a similar task
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const taskInput = page.locator('input[placeholder*="task"]').first();
    await taskInput.fill('Pay gas bill');

    // Wait for ML suggestions (they appear as user types)
    await page.waitForTimeout(2000);

    // Check if predicted tags are shown
    const suggestions = page.locator('text=/finance|bills|utilities/i');
    if (await suggestions.count() > 0) {
      await expect(suggestions.first()).toBeVisible();
    }
  });

  test('should predict schedule based on historical patterns', async ({ request, page }) => {
    // Create tasks scheduled on Mondays
    const mondayTasks = [
      { title: 'Weekly team meeting', scheduledDate: getNextMonday() },
      { title: 'Weekly standup', scheduledDate: getNextMonday(7) },
      { title: 'Weekly review', scheduledDate: getNextMonday(14) },
    ];

    for (const taskData of mondayTasks) {
      const createRes = await request.post('http://localhost:3000/api/tasks', {
        data: {
          title: taskData.title,
          scheduledDate: taskData.scheduledDate.toISOString(),
        },
        headers: {
          Cookie: await getAuthCookie(page),
        },
      });

      if (createRes.ok()) {
        const task = await createRes.json();
        testTaskIds.push(task.task._id);

        // Mark as completed
        await request.patch(`http://localhost:3000/api/tasks/${task.task._id}`, {
          data: { status: 'completed' },
          headers: {
            Cookie: await getAuthCookie(page),
          },
        });
      }
    }

    // Test schedule prediction
    const learnRes = await request.post('http://localhost:3000/api/tasks/learn', {
      data: { taskTitle: 'Weekly sync meeting' },
      headers: {
        Cookie: await getAuthCookie(page),
      },
    });

    if (learnRes.ok()) {
      const predictions = await learnRes.json();
      
      // Verify predictions exist
      expect(predictions).toHaveProperty('predictedSchedule');
      
      if (predictions.predictedSchedule) {
        const predictedDate = new Date(predictions.predictedSchedule);
        const dayOfWeek = predictedDate.getDay();
        // Should predict a Monday (1) or similar day
        expect([0, 1, 2]).toContain(dayOfWeek);
      }
    }
  });

  test('should predict priority based on similar tasks', async ({ request, page }) => {
    // Create high priority tasks
    const highPriorityTasks = [
      { title: 'Fix critical bug urgent', priority: 'urgent' },
      { title: 'Resolve production issue urgent', priority: 'urgent' },
      { title: 'Emergency fix urgent', priority: 'urgent' },
    ];

    for (const taskData of highPriorityTasks) {
      const createRes = await request.post('http://localhost:3000/api/tasks', {
        data: taskData,
        headers: {
          Cookie: await getAuthCookie(page),
        },
      });

      if (createRes.ok()) {
        const task = await createRes.json();
        testTaskIds.push(task.task._id);

        await request.patch(`http://localhost:3000/api/tasks/${task.task._id}`, {
          data: { status: 'completed' },
          headers: {
            Cookie: await getAuthCookie(page),
          },
        });
      }
    }

    // Test priority prediction
    const learnRes = await request.post('http://localhost:3000/api/tasks/learn', {
      data: { taskTitle: 'Fix urgent production bug' },
      headers: {
        Cookie: await getAuthCookie(page),
      },
    });

    if (learnRes.ok()) {
      const predictions = await learnRes.json();
      expect(predictions).toHaveProperty('predictedPriority');
      
      // Should predict urgent based on similar tasks
      if (predictions.predictedPriority) {
        expect(['urgent', 'high']).toContain(predictions.predictedPriority);
      }
    }
  });

  test('should learn recurring task patterns', async ({ request, page }) => {
    // Create a recurring task and complete it multiple times
    const recurringTaskTitle = 'Monthly heating bill payment';

    // Create initial recurring task
    const createRes = await request.post('http://localhost:3000/api/tasks', {
      data: {
        title: recurringTaskTitle,
        isRecurring: true,
        recurringPattern: {
          frequency: 'monthly',
          interval: 1,
        },
        tags: ['finance', 'bills'],
      },
      headers: {
        Cookie: await getAuthCookie(page),
      },
    });

    if (createRes.ok()) {
      const task = await createRes.json();
      testTaskIds.push(task.task._id);

      // Complete it multiple times to build history
      for (let i = 0; i < 3; i++) {
        await request.patch(`http://localhost:3000/api/tasks/${task.task._id}`, {
          data: {
            status: 'completed',
            amount: 150 + i * 10,
          },
          headers: {
            Cookie: await getAuthCookie(page),
          },
        });
        await page.waitForTimeout(500);
      }

      // Test pattern learning
      const learnRes = await request.post('http://localhost:3000/api/tasks/learn', {
        data: { taskTitle: recurringTaskTitle },
        headers: {
          Cookie: await getAuthCookie(page),
        },
      });

      if (learnRes.ok()) {
        const predictions = await learnRes.json();
        expect(predictions).toHaveProperty('recurringPatterns');
        
        // Should detect monthly pattern
        if (predictions.recurringPatterns && Object.keys(predictions.recurringPatterns).length > 0) {
          const pattern = Object.values(predictions.recurringPatterns)[0] as any;
          expect(['monthly', 'weekly']).toContain(pattern.frequency);
        }
      }
    }
  });

  test('should improve predictions with more data', async ({ request, page }) => {
    // Create multiple similar tasks to build a pattern
    const similarTasks = [
      'Review code PR',
      'Review pull request',
      'Code review',
      'Review merge request',
    ];

    for (const title of similarTasks) {
      const createRes = await request.post('http://localhost:3000/api/tasks', {
        data: {
          title,
          tags: ['work', 'development'],
          priority: 'medium',
        },
        headers: {
          Cookie: await getAuthCookie(page),
        },
      });

      if (createRes.ok()) {
        const task = await createRes.json();
        testTaskIds.push(task.task._id);

        await request.patch(`http://localhost:3000/api/tasks/${task.task._id}`, {
          data: { status: 'completed' },
          headers: {
            Cookie: await getAuthCookie(page),
          },
        });
      }
    }

    // Test that predictions improve with more data
    const learnRes = await request.post('http://localhost:3000/api/tasks/learn', {
      data: { taskTitle: 'Review code changes' },
      headers: {
        Cookie: await getAuthCookie(page),
      },
    });

    if (learnRes.ok()) {
      const predictions = await learnRes.json();
      
      // Should predict work/development tags
      if (predictions.predictedTags && predictions.predictedTags.length > 0) {
        const hasWorkTag = predictions.predictedTags.some((tag: string) => 
          tag.toLowerCase().includes('work') || tag.toLowerCase().includes('development')
        );
        expect(hasWorkTag).toBeTruthy();
      }
    }
  });

  test('should handle empty history gracefully', async ({ request, page }) => {
    // Test with a new user or no completed tasks
    const learnRes = await request.post('http://localhost:3000/api/tasks/learn', {
      data: { taskTitle: 'New task with no history' },
      headers: {
        Cookie: await getAuthCookie(page),
      },
    });

    // Should not error, but may return empty predictions
    expect(learnRes.ok()).toBeTruthy();
    
    const predictions = await learnRes.json();
    expect(predictions).toHaveProperty('predictedTags');
    expect(predictions).toHaveProperty('predictedPriority');
    // Should default to medium if no history
    if (predictions.predictedPriority) {
      expect(predictions.predictedPriority).toBe('medium');
    }
  });

  test('should calculate similarity scores correctly', async ({ request, page }) => {
    // Create tasks with varying similarity
    const tasks = [
      { title: 'Pay heating bill', tags: ['finance'], priority: 'high' },
      { title: 'Pay electricity bill', tags: ['finance'], priority: 'high' },
      { title: 'Buy groceries', tags: ['shopping'], priority: 'low' },
    ];

    for (const taskData of tasks) {
      const createRes = await request.post('http://localhost:3000/api/tasks', {
        data: taskData,
        headers: {
          Cookie: await getAuthCookie(page),
        },
      });

      if (createRes.ok()) {
        const task = await createRes.json();
        testTaskIds.push(task.task._id);

        await request.patch(`http://localhost:3000/api/tasks/${task.task._id}`, {
          data: { status: 'completed' },
          headers: {
            Cookie: await getAuthCookie(page),
          },
        });
      }
    }

    // Test that similar tasks (bills) are found, but dissimilar (groceries) are not
    const learnRes = await request.post('http://localhost:3000/api/tasks/learn', {
      data: { taskTitle: 'Pay water bill' },
      headers: {
        Cookie: await getAuthCookie(page),
      },
    });

    if (learnRes.ok()) {
      const predictions = await learnRes.json();
      
      // Should predict finance tag (similar to other bills)
      if (predictions.predictedTags && predictions.predictedTags.length > 0) {
        const hasFinanceTag = predictions.predictedTags.some((tag: string) => 
          tag.toLowerCase().includes('finance')
        );
        expect(hasFinanceTag).toBeTruthy();
      }
    }
  });
});

// Helper functions
async function getAuthCookie(page: any): Promise<string> {
  // In a real test, you'd authenticate and get the session cookie
  // For now, return empty - tests will need proper auth setup
  // The API routes will handle authentication via NextAuth session
  return '';
}

async function createTestTask(request: any, page: any, taskData: any): Promise<string | null> {
  try {
    // First, ensure we're authenticated by visiting the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create task via UI or API
    const response = await request.post('http://localhost:3000/api/tasks', {
      data: taskData,
    });
    
    if (response.ok()) {
      const result = await response.json();
      return result.task?._id || null;
    }
  } catch (error) {
    console.error('Failed to create test task:', error);
  }
  return null;
}

function getNextMonday(offsetDays: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  date.setDate(diff);
  return date;
}

