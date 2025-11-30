'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import SwipeableTaskView from './SwipeableTaskView';
import CalendarView from './CalendarView';
import InboxView from './InboxView';
import Settings from './Settings';
import Webhooks from './Webhooks';
import Boards from './Boards';
import Sidebar from './Sidebar';
import KanbanBoard from './KanbanBoard';
import SearchBar from './SearchBar';
import TaskFilters from './TaskFilters';

type View = 'inbox' | 'today' | 'upcoming' | 'list' | 'swipe' | 'calendar' | 'settings' | 'webhooks' | 'boards' | 'filters' | 'categories' | 'kanban';

export default function Dashboard() {
  const { data: session } = useSession();
  const [view, setView] = useState<View>('today');
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [taskCounts, setTaskCounts] = useState({
    inbox: 0,
    today: 0,
    upcoming: 0,
  });

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      const allTasks = data.tasks || [];
      setTasks(allTasks);

      // Calculate counts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setTaskCounts({
        inbox: allTasks.filter((t: any) => t.isInbox && t.status === 'todo').length,
        today: allTasks.filter((t: any) => {
          const taskDate = t.scheduledDate || t.dueDate;
          if (!taskDate) return false;
          const date = new Date(taskDate);
          return date >= today && date < tomorrow && t.status !== 'completed';
        }).length,
        upcoming: allTasks.filter((t: any) => {
          const taskDate = t.scheduledDate || t.dueDate;
          if (!taskDate) return false;
          return new Date(taskDate) >= tomorrow && t.status !== 'completed';
        }).length,
      });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask: any) => {
    setTasks([newTask, ...tasks]);
  };

  const handleTaskUpdated = (updatedTask: any) => {
    setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter((t) => t._id !== taskId));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const res = await fetch(`/api/tasks?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setFilteredTasks(data.tasks || []);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setFilteredTasks([]);
    }
  };

  const handleFilterChange = (filtered: any[]) => {
    setFilteredTasks(filtered);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const getFilteredTasks = () => {
    // If search is active, use search results
    if (searchQuery.trim()) {
      return filteredTasks;
    }

    // If filters view is active, use filtered tasks
    if (view === 'filters' && filteredTasks.length > 0) {
      return filteredTasks;
    }

    // Otherwise, apply view-based filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (view) {
      case 'inbox':
        return tasks.filter((t) => t.isInbox && t.status === 'todo');
      case 'today':
        return tasks.filter((t) => {
          const taskDate = t.scheduledDate || t.dueDate;
          if (!taskDate) return false;
          const date = new Date(taskDate);
          return date >= today && date < tomorrow && t.status !== 'completed';
        });
      case 'upcoming':
        return tasks.filter((t) => {
          const taskDate = t.scheduledDate || t.dueDate;
          if (!taskDate) return false;
          return new Date(taskDate) >= tomorrow && t.status !== 'completed';
        });
      default:
        return tasks.filter((t) => t.status !== 'completed');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        taskCounts={taskCounts}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background with gradient and abstract shape */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom right, var(--primary-color-light), white)',
          }}
        >
          {/* Abstract white shape on the right */}
          <div 
            className="absolute right-0 top-0 w-1/2 h-full opacity-30"
            style={{
              background: 'radial-gradient(ellipse at top right, white 0%, transparent 70%)',
            }}
          />
        </div>
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-white px-6 py-4 shadow-sm" style={{ backgroundColor: 'var(--primary-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold capitalize">
                {view === 'today' ? 'Today' : view === 'upcoming' ? 'Upcoming' : view === 'inbox' ? 'Inbox' : view === 'list' ? 'All Tasks' : view === 'kanban' ? 'People' : view}
              </h1>
              {view === 'today' && (
                <p className="text-sm opacity-90 mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {showSearch ? (
                <div className="w-80">
                  <SearchBar onSearch={handleSearch} />
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-lg transition-colors opacity-90 hover:opacity-100"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Search tasks"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
              {showSearch && (
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setFilteredTasks([]);
                  }}
                  className="p-2 rounded-lg transition-colors text-white opacity-90 hover:opacity-100"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative z-10">
          {view === 'kanban' ? (
            <div className="h-full p-4">
              <KanbanBoard
                tasks={tasks.filter((t) => t.status !== 'completed')}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 space-y-4">
            {view === 'inbox' && (
              <InboxView
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            )}

            {(view === 'list' || view === 'today' || view === 'upcoming') && (
              <div>
                <TaskInput onTaskCreated={handleTaskCreated} />
                {loading ? (
                  <div className="mt-8 text-center text-gray-500">Loading tasks...</div>
                ) : (
                  <TaskList
                    tasks={getFilteredTasks()}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                  />
                )}
              </div>
            )}

            {view === 'swipe' && (
              <div>
                {loading ? (
                  <div className="mt-8 text-center text-gray-500">Loading tasks...</div>
                ) : (
                  <SwipeableTaskView
                    tasks={tasks.filter((t) => t.status !== 'completed')}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                  />
                )}
              </div>
            )}

            {view === 'calendar' && (
              <CalendarView
                tasks={tasks}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            )}

            {view === 'settings' && <Settings />}

            {view === 'webhooks' && <Webhooks />}

            {view === 'boards' && <Boards />}

            {view === 'categories' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
                <p className="text-gray-600">Category management coming soon...</p>
              </div>
            )}

            {view === 'filters' && (
              <TaskFilters
                tasks={tasks}
                onFilterChange={handleFilterChange}
              />
            )}
              </div>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}

