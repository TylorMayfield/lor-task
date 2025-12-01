'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import CategoryTree from './CategoryTree';
import { Inbox } from 'lucide-react';

interface InboxViewProps {
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function InboxView({
  onTaskUpdated,
  onTaskDeleted,
}: InboxViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  useEffect(() => {
    fetchInboxTasks();
  }, []);

  const fetchInboxTasks = async () => {
    try {
      const res = await fetch('/api/tasks?inbox=true&status=todo');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch inbox tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToCategory = async (taskId: string, categoryId: string | null) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryId || undefined, isInbox: false }),
      });

      if (!res.ok) throw new Error('Failed to move task');

      const data = await res.json();
      onTaskUpdated(data.task);
      setTasks(tasks.filter((t) => t._id !== taskId));
      setSelectedTask(null);
      setShowCategorySelector(false);
    } catch (error) {
      console.error('Failed to move task:', error);
      alert('Failed to move task to category');
    }
  };

  const handleSchedule = async (taskId: string, scheduledDate: Date | null) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduledDate: scheduledDate ? scheduledDate.toISOString() : undefined, 
          isInbox: false 
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule task');

      const data = await res.json();
      onTaskUpdated(data.task);
      setTasks(tasks.filter((t) => t._id !== taskId));
      setSelectedTask(null);
      setShowSchedulePicker(false);
    } catch (error) {
      console.error('Failed to schedule task:', error);
      alert('Failed to schedule task');
    }
  };

  const handleRemoveFromInbox = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isInbox: false }),
      });

      if (!res.ok) throw new Error('Failed to remove from inbox');

      const data = await res.json();
      onTaskUpdated(data.task);
      setTasks(tasks.filter((t) => t._id !== taskId));
    } catch (error) {
      console.error('Failed to remove from inbox:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading inbox...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">
          {tasks.length} unsorted task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center shadow-sm" style={{ borderRadius: '12px' }}>
          <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 mb-2">Your inbox is empty!</p>
          <p className="text-sm text-gray-500">
            New tasks without categories, boards, or schedules will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="task-card"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900">{task.title}</h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {task.tags?.map((tag: any) => {
                      const tagName = typeof tag === 'string' ? tag : tag.name || tag._id;
                      return (
                        <span
                          key={typeof tag === 'string' ? tag : tag._id || tag.name}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                          style={{ borderRadius: '9999px' }}
                        >
                          {tagName}
                        </span>
                      );
                    })}
                    <span 
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700"
                      style={{ borderRadius: '9999px' }}
                    >
                      <Inbox className="w-3 h-3" />
                      Inbox
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(task.createdAt), 'MMM d')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowSchedulePicker(true);
                      setShowCategorySelector(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    style={{ borderRadius: '9999px' }}
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowCategorySelector(true);
                      setShowSchedulePicker(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    style={{ borderRadius: '9999px' }}
                  >
                    Categorize
                  </button>
                  <button
                    onClick={() => handleRemoveFromInbox(task._id)}
                    className="px-2 py-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove from inbox"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Selector Modal */}
      {showCategorySelector && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
               style={{ borderRadius: '16px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}>
            <h3 className="text-lg font-semibold mb-4">Select Category</h3>
            <CategoryTree
              selectedCategoryId={undefined}
              onCategorySelect={(categoryId) => {
                if (selectedTask) {
                  handleMoveToCategory(selectedTask._id, categoryId);
                }
              }}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCategorySelector(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Picker Modal */}
      {showSchedulePicker && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
               style={{ borderRadius: '16px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}>
            <h3 className="text-lg font-semibold mb-4">Schedule Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="schedule-date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowSchedulePicker(false);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const dateInput = document.getElementById('schedule-date') as HTMLInputElement;
                    if (dateInput?.value) {
                      handleSchedule(selectedTask._id, new Date(dateInput.value));
                    }
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">About the Inbox</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Tasks automatically go to inbox when created without organization</li>
            <li>• Schedule a task to move it out of inbox</li>
            <li>• Assign a category to organize it</li>
            <li>• Add to a board for collaboration</li>
          </ul>
        </div>
      )}
    </div>
  );
}

