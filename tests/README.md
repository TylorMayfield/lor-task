# Playwright Test Suite

This directory contains end-to-end tests for the LOR Task application using Playwright.

## Test Structure

### Helpers
- `helpers/auth.ts` - Authentication utilities for tests
- `helpers/tasks.ts` - Task operation utilities

### Test Files
- `task-creation.spec.ts` - Tests for creating tasks with NLP parsing
- `task-basic-operations.spec.ts` - Basic CRUD operations for tasks
- `collections-basic.spec.ts` - Basic collection operations
- `collections.spec.ts` - Advanced collection features (drag & drop, nesting)
- `drag-and-drop.spec.ts` - Drag and drop functionality
- `views-navigation.spec.ts` - View navigation and routing
- `task-nlp-parsing.spec.ts` - NLP parsing features

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/task-basic-operations.spec.ts

# Run with UI mode
npm run test:e2e:ui

# Run specific browser
npm run test:e2e -- --project=chromium
```

## Test Authentication

Tests use the credentials provider with unique emails per test run to avoid conflicts. The auth helper automatically generates unique test emails.

## Writing New Tests

1. Import the helpers you need:
```typescript
import { ensureAuthenticated } from './helpers/auth';
import { createTask, waitForTask } from './helpers/tasks';
```

2. Authenticate in beforeEach:
```typescript
test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page);
  await page.goto('/dashboard/today');
  await page.waitForLoadState('networkidle');
});
```

3. Use helper functions for common operations:
```typescript
await createTask(page, 'My test task');
await waitForTask(page, 'My test task');
```

## Coverage Goals

- ✅ Task creation with NLP
- ✅ Task CRUD operations
- ✅ Collections management
- ✅ Drag and drop
- ✅ View navigation
- ⏳ Advanced features (webhooks, boards, etc.)

