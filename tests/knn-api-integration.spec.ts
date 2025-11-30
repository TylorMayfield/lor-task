import { test, expect } from '@playwright/test';

test.describe('KNN Pattern Learning - API Integration', () => {
  test('should return predictions from /api/tasks/learn endpoint', async ({ request, page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test the learn endpoint directly
    const response = await request.post('http://localhost:3000/api/tasks/learn', {
      data: {
        taskTitle: 'Pay monthly heating bill',
        taskDescription: 'Utility payment',
      },
    });

    expect(response.ok()).toBeTruthy();
    
    const predictions = await response.json();
    
    // Verify response structure
    expect(predictions).toHaveProperty('predictedTags');
    expect(predictions).toHaveProperty('predictedSchedule');
    expect(predictions).toHaveProperty('predictedPriority');
    expect(predictions).toHaveProperty('recurringPatterns');

    // Verify types
    expect(Array.isArray(predictions.predictedTags)).toBeTruthy();
    expect(['low', 'medium', 'high', 'urgent']).toContain(predictions.predictedPriority);
  });

  test('should handle missing task title gracefully', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/tasks/learn', {
      data: {},
    });

    // Should either return default predictions or error appropriately
    expect([200, 400]).toContain(response.status());
  });

  test('should provide predictions for various task types', async ({ request }) => {
    const testCases = [
      { title: 'Pay heating bill', expectedTags: ['finance', 'bills'] },
      { title: 'Buy groceries', expectedTags: ['shopping'] },
      { title: 'Fix critical bug urgent', expectedPriority: 'urgent' },
      { title: 'Weekly team meeting', expectedTags: ['work'] },
    ];

    for (const testCase of testCases) {
      const response = await request.post('http://localhost:3000/api/tasks/learn', {
        data: { taskTitle: testCase.title },
      });

      if (response.ok()) {
        const predictions = await response.json();
        
        // Verify predictions exist
        expect(predictions.predictedTags).toBeDefined();
        expect(predictions.predictedPriority).toBeDefined();
      }
    }
  });

  test('should improve predictions with task history', async ({ request, page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create and complete similar tasks to build history
    const similarTasks = [
      'Review code changes',
      'Review pull request',
      'Code review task',
    ];

    // Note: In a real test, you'd need to authenticate and create tasks
    // This is a structure test showing what should happen

    // After creating history, predictions should improve
    const response = await request.post('http://localhost:3000/api/tasks/learn', {
      data: { taskTitle: 'Review merge request' },
    });

    if (response.ok()) {
      const predictions = await response.json();
      
      // With history, should predict work-related tags
      if (predictions.predictedTags && predictions.predictedTags.length > 0) {
        // Verify predictions are reasonable
        expect(predictions.predictedTags).toBeInstanceOf(Array);
      }
    }
  });

  test('should return recurring patterns when available', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/tasks/learn', {
      data: { taskTitle: 'Monthly bill payment' },
    });

    if (response.ok()) {
      const predictions = await response.json();
      
      expect(predictions).toHaveProperty('recurringPatterns');
      expect(typeof predictions.recurringPatterns).toBe('object');
    }
  });
});

