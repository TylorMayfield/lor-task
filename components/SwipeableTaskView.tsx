'use client';

import { useState, useEffect } from 'react';
import SwipeableTaskCard from './SwipeableTaskCard';
import { TaskStatus } from '@/lib/models/Task';

interface SwipeableTaskViewProps {
  tasks: any[];
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
  canEdit?: boolean;
}

export default function SwipeableTaskView({
  tasks,
  onTaskUpdated,
  onTaskDeleted,
  canEdit = true,
}: SwipeableTaskViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleTasks, setVisibleTasks] = useState<any[]>([]);

  useEffect(() => {
    // Show current task and next 2 tasks
    const visible = tasks.slice(currentIndex, currentIndex + 3);
    setVisibleTasks(visible);
  }, [tasks, currentIndex]);

  const handleSwipeLeft = async (task: any) => {
    if (!canEdit) return;

    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const res = await fetch(`/api/tasks/${task._id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete task');

        onTaskDeleted(task._id);
        if (currentIndex < tasks.length - 1) {
          setCurrentIndex(currentIndex);
        } else if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const handleSwipeRight = async (task: any) => {
    if (!canEdit) return;

    const newStatus =
      task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;

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
      alert('Failed to update task');
    }
  };

  const handleNext = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No tasks to display</p>
        <p className="text-sm mt-2">Swipe left to delete, right to complete</p>
      </div>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <div className="relative">
      <div className="mb-4 text-center text-sm text-gray-600">
        {currentIndex + 1} of {tasks.length}
      </div>

      <div className="relative h-96 max-w-md mx-auto">
        {visibleTasks.map((task, index) => {
          const isCurrent = index === 0;
          const zIndex = visibleTasks.length - index;
          const scale = isCurrent ? 1 : 1 - (index * 0.05);
          const yOffset = index * 10;

          return (
            <div
              key={task._id}
              className="absolute inset-0 transition-all duration-300"
              style={{
                zIndex,
                transform: `scale(${scale}) translateY(${yOffset}px)`,
                opacity: isCurrent ? 1 : 0.7,
              }}
            >
              <SwipeableTaskCard
                task={task}
                onSwipeLeft={isCurrent ? handleSwipeLeft : undefined}
                onSwipeRight={isCurrent ? handleSwipeRight : undefined}
                onComplete={isCurrent ? handleSwipeRight : undefined}
                canEdit={canEdit}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex >= tasks.length - 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
        >
          Next →
        </button>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Swipe left to delete • Swipe right to complete</p>
        <p className="mt-1">Or use buttons above</p>
      </div>
    </div>
  );
}

