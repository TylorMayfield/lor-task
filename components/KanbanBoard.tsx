'use client';

import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { TaskStatus } from '@/lib/models/Task';
import { LayoutGrid } from 'lucide-react';

interface KanbanBoardProps {
  tasks: any[];
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function KanbanBoard({
  tasks,
  onTaskUpdated,
  onTaskDeleted,
}: KanbanBoardProps) {
  const { data: session } = useSession();

  // Group tasks by user (for now, we'll use the task owner)
  // In a real app, you'd have assignees
  const tasksByUser = tasks.reduce((acc: any, task: any) => {
    const userId = task.userId?._id || task.userId || 'me';
    const userName = task.userId?.name || task.userId?.email || 'Me';
    
    if (!acc[userId]) {
      acc[userId] = {
        user: { id: userId, name: userName, email: task.userId?.email },
        tasks: [],
      };
    }
    acc[userId].tasks.push(task);
    return acc;
  }, {});

  // Add current user as "Me" if they have tasks
  const currentUserId = session?.user?.id;
  if (currentUserId && tasksByUser[currentUserId]) {
    tasksByUser[currentUserId].user.name = 'Me';
  }

  const userColumns = Object.values(tasksByUser);

  const handleToggleComplete = async (task: any) => {
    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.TODO
        : TaskStatus.COMPLETED;

    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      const data = await res.json();
      onTaskUpdated(data.task);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getProjectPath = (task: any) => {
    const parts = [];
    if (task.boardId) {
      const boardName = typeof task.boardId === 'object' ? task.boardId.name : 'Board';
      parts.push(boardName);
    }
    if (task.categoryId) {
      const categoryName = typeof task.categoryId === 'object' ? task.categoryId.name : 'Category';
      parts.push(categoryName);
    }
    if (task.status === TaskStatus.IN_PROGRESS) {
      parts.push('Progress');
    } else if (task.status === TaskStatus.TODO) {
      parts.push('Todo');
    } else if (task.status === TaskStatus.COMPLETED) {
      parts.push('Done');
    }
    return parts.length > 0 ? parts.join(' > ') : null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max px-4">
          {userColumns.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 mb-2">No tasks yet</p>
                <p className="text-sm text-gray-500">Create tasks to see them organized by user</p>
              </div>
            </div>
          ) : (
            userColumns.map((column: any) => (
              <div
                key={column.user.id}
                className="w-80 flex-shrink-0 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials(column.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{column.user.name}</h3>
                    <p className="text-xs text-gray-500">{column.tasks.length} tasks</p>
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {column.tasks.map((task: any) => {
                    const projectPath = getProjectPath(task);
                    return (
                      <div
                        key={task._id}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                      >
                        {projectPath && (
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            {projectPath}
                          </div>
                        )}
                        <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-gray-500">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {format(new Date(task.dueDate), 'MMM d')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleComplete(task);
                              }}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                task.status === TaskStatus.COMPLETED
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {task.status === TaskStatus.COMPLETED && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                              {getInitials(column.user.name)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

