'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import CategoryTree from './CategoryTree';
import { Inbox, Calendar, Sparkles, Folder, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContextMenu from './ContextMenu';
import KNNSuggestions from './KNNSuggestions';

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: any } | null>(null);
  const [knnTask, setKnnTask] = useState<any | null>(null);

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

  const handleScheduleToday = async (taskId: string) => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    await handleSchedule(taskId, today);
  };

  const handleScheduleTomorrow = async (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await handleSchedule(taskId, tomorrow);
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
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to schedule task:', error);
      alert('Failed to schedule task');
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
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to move task:', error);
      alert('Failed to move task to category');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete task');

      onTaskDeleted(taskId);
      setTasks(tasks.filter((t) => t._id !== taskId));
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, task: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, task });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      {tasks.length > 0 && (
        <div className="mb-4">
          <p className="ios-footnote text-gray-400">
            {tasks.length} unscheduled task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ios-card text-center py-16"
        >
          <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="ios-headline text-white mb-2">Your inbox is empty!</p>
          <p className="ios-body text-gray-400">
            New tasks without categories, boards, or schedules will appear here
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onContextMenu={(e) => handleContextMenu(e, task)}
                className="ios-list-item group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="ios-headline text-white mb-1">{task.title}</h3>
                    {task.description && (
                      <p className="ios-body text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                    )}
                    
                    {/* KNN Suggestions */}
                    {knnTask?._id === task._id && (
                      <KNNSuggestions
                        taskTitle={task.title}
                        taskDescription={task.description}
                        onScheduleSuggestion={(date) => handleSchedule(task._id, date)}
                        onTagSuggestion={(tag) => {
                          // Handle tag suggestion
                          console.log('Tag suggestion:', tag);
                        }}
                      />
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {task.tags?.map((tag: any) => {
                        const tagName = typeof tag === 'string' ? tag : tag.name || tag._id;
                        return (
                          <span
                            key={typeof tag === 'string' ? tag : tag._id || tag.name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ios-footnote font-medium bg-blue-600/20 text-blue-400"
                          >
                            {tagName}
                          </span>
                        );
                      })}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ios-footnote font-medium bg-[#2c2c2e] text-gray-300">
                        <Inbox className="w-3 h-3" />
                        Inbox
                      </span>
                      <span className="ios-footnote text-gray-500">
                        {format(new Date(task.createdAt), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setKnnTask(task);
                        setTimeout(() => setKnnTask(null), 5000);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                      title="Show AI suggestions"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScheduleToday(task._id)}
                      className="px-3 py-1.5 ios-footnote font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handleScheduleTomorrow(task._id)}
                      className="px-3 py-1.5 ios-footnote font-semibold bg-[#2c2c2e] text-gray-300 rounded-lg hover:bg-[#38383a] transition-colors"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              id: 'today',
              label: 'Do Today',
              icon: <Calendar className="w-5 h-5" />,
              onClick: () => handleScheduleToday(contextMenu.task._id),
            },
            {
              id: 'tomorrow',
              label: 'Do Tomorrow',
              icon: <Calendar className="w-5 h-5" />,
              onClick: () => handleScheduleTomorrow(contextMenu.task._id),
            },
            {
              id: 'categorize',
              label: 'Categorize',
              icon: <Folder className="w-5 h-5" />,
              onClick: () => {
                setSelectedTask(contextMenu.task);
                setShowCategorySelector(true);
              },
            },
            {
              id: 'suggestions',
              label: 'AI Suggestions',
              icon: <Sparkles className="w-5 h-5" />,
              onClick: () => {
                setKnnTask(contextMenu.task);
                setTimeout(() => setKnnTask(null), 5000);
              },
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: <Trash2 className="w-5 h-5" />,
              onClick: () => handleDelete(contextMenu.task._id),
              destructive: true,
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Category Selector Modal */}
      {showCategorySelector && selectedTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => {
          setShowCategorySelector(false);
          setSelectedTask(null);
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1c1c1e] rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-[#38383a]"
          >
            <h3 className="ios-title-2 text-white mb-4">Select Category</h3>
            <CategoryTree
              selectedCategoryId={undefined}
              onCategorySelect={(categoryId) => {
                if (selectedTask) {
                  handleMoveToCategory(selectedTask._id, categoryId);
                }
              }}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowCategorySelector(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 ios-body font-semibold text-blue-500 hover:bg-[#2c2c2e] rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
