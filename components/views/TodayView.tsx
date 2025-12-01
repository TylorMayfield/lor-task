'use client';

import { useState, useEffect } from 'react';
import TaskInput from '../TaskInput';
import TaskList from '../TaskList';

interface TodayViewProps {
  tasks: any[];
  loading: boolean;
  onTaskCreated: (task: any) => void;
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragEnd?: () => void;
}

export default function TodayView({
  tasks,
  loading,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskDragStart,
  onTaskDragEnd,
}: TodayViewProps) {
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter((t) => {
      const taskDate = t.scheduledDate || t.dueDate;
      if (!taskDate) return false;
      const date = new Date(taskDate);
      return date >= today && date < tomorrow && t.status !== 'completed';
    });

    setFilteredTasks(todayTasks);
  }, [tasks]);

  return (
    <div className="max-w-4xl mx-auto">
      <div
        className="bg-[var(--md-surface)] p-6 transition-all mb-6"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--md-outline-variant)',
          boxShadow: 'var(--md-elevation-1)',
        }}
      >
        <TaskInput onTaskCreated={onTaskCreated} />
      </div>

      <div
        className="bg-[var(--md-surface)] p-6 transition-all"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--md-outline-variant)',
          boxShadow: 'var(--md-elevation-1)',
        }}
      >
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[var(--md-primary-container)] border-t-[var(--md-primary)] rounded-full animate-spin"></div>
            <p className="mt-4 md-body-medium text-[var(--md-on-surface-variant)]">Loading tasks...</p>
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            onTaskUpdated={onTaskUpdated}
            onTaskDeleted={onTaskDeleted}
            onTaskDragStart={onTaskDragStart}
            onTaskDragEnd={onTaskDragEnd}
          />
        )}
      </div>
    </div>
  );
}

