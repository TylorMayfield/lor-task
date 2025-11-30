'use client';

import { useState, useEffect } from 'react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import TaskList from './TaskList';

interface CalendarViewProps {
  tasks: any[];
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function CalendarView({
  tasks,
  onTaskUpdated,
  onTaskDeleted,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarTasks, setCalendarTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchCalendarTasks();
  }, [selectedDate]);

  const fetchCalendarTasks = async () => {
    try {
      const res = await fetch(`/api/tasks/calendar?date=${selectedDate.toISOString()}`);
      const data = await res.json();
      setCalendarTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch calendar tasks:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate((prev) => (direction === 'next' ? addDays(prev, 1) : subDays(prev, 1)));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        {!isToday && (
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {calendarTasks.length} task{calendarTasks.length !== 1 ? 's' : ''} scheduled for this day
        </p>
      </div>

      <TaskList
        tasks={calendarTasks}
        onTaskUpdated={(task) => {
          onTaskUpdated(task);
          fetchCalendarTasks();
        }}
        onTaskDeleted={(taskId) => {
          onTaskDeleted(taskId);
          fetchCalendarTasks();
        }}
      />
    </div>
  );
}

