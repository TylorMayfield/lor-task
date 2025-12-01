'use client';

import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { TaskStatus } from '@/lib/models/Task';
import { Paperclip, MessageSquare, Link2, LayoutGrid } from 'lucide-react';
import TaskInput from './TaskInput';

interface KanbanBoardProps {
  tasks: any[];
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function KanbanBoard({
  tasks,
  onTaskUpdated,
  onTaskDeleted,
  onTaskCreated,
}: KanbanBoardProps & { onTaskCreated?: (task: any) => void }) {
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
    <div className="h-full flex flex-col relative z-10">
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max px-8 py-6">
          {userColumns.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 mb-2">No tasks yet</p>
                <p className="text-sm text-gray-500">Create tasks to see them organized by user</p>
              </div>
            </div>
          ) : (
            userColumns.map((column: any) => {
              const isMe = column.user.id === currentUserId;
              return (
              <div
                key={column.user.id}
                className="w-72 flex-shrink-0 flex flex-col"
              >
                {/* Column Header */}
                <div className={`mb-5 ${isMe ? 'text-white' : 'text-white/90'}`}>
                  <h3 className={`text-sm font-bold mb-3 ${isMe ? 'text-white' : 'text-white/90'}`}>
                    {column.user.name}
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 text-sm font-semibold shadow-lg">
                    {getInitials(column.user.name)}
                  </div>
                </div>

                {/* Task Input for "Me" Column */}
                {isMe && onTaskCreated && (
                  <div className="mb-3">
                    <TaskInput onTaskCreated={onTaskCreated} />
                  </div>
                )}

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {column.tasks.map((task: any) => {
                    const projectPath = getProjectPath(task);
                    return (
                      <div
                        key={task._id}
                        className="task-card"
                        onClick={() => {
                          // Could open task details modal here
                        }}
                      >
                        {projectPath && (
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            {projectPath}
                          </div>
                        )}
                        <h4 className="text-sm font-normal text-gray-900 mb-3 line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-gray-400">
                            {/* Interaction icons - can be made conditional based on task data */}
                            <Paperclip className="w-3.5 h-3.5 hover:text-gray-600 cursor-pointer transition-colors" />
                            <MessageSquare className="w-3.5 h-3.5 hover:text-gray-600 cursor-pointer transition-colors" />
                            <Link2 className="w-3.5 h-3.5 hover:text-gray-600 cursor-pointer transition-colors" />
                          </div>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm">
                            {getInitials(column.user.name)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

