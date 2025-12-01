import { Page, APIRequestContext } from '@playwright/test';

/**
 * Create a task via API (for testing purposes)
 * This is more reliable than UI interaction for test setup
 */
export async function createTaskViaAPI(
  request: APIRequestContext,
  taskText: string,
  options: {
    email?: string;
    password?: string;
    boardId?: string;
  } = {}
): Promise<any> {
  // Get session cookie from the page context
  // For now, we'll need to pass the page to get cookies
  const response = await request.post('http://localhost:3000/api/tasks', {
    data: {
      text: taskText,
      ...(options.boardId && { boardId: options.boardId }),
    },
    // Note: In a real scenario, you'd need to pass the session cookie
    // For now, this will work if the API doesn't require auth in test mode
  });

  if (!response.ok()) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Task creation failed: ${error.error || `HTTP ${response.status()}`}`);
  }

  const data = await response.json();
  return data.task;
}

/**
 * Get tasks via API
 */
export async function getTasksViaAPI(
  request: APIRequestContext,
  filters: {
    status?: string[];
    priority?: string[];
    search?: string;
  } = {}
): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status.join(','));
  if (filters.priority) params.append('priority', filters.priority.join(','));
  if (filters.search) params.append('search', filters.search);

  const response = await request.get(`http://localhost:3000/api/tasks?${params.toString()}`);

  if (!response.ok()) {
    throw new Error(`Failed to fetch tasks: HTTP ${response.status()}`);
  }

  const data = await response.json();
  return data.tasks || [];
}

