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
import { Inbox, Calendar, CalendarDays, CheckSquare2, Users } from 'lucide-react';
import Boards from './Boards';
import Sidebar from './Sidebar';
import KanbanBoard from './KanbanBoard';
import SearchBar from './SearchBar';
import FloatingHeader from './FloatingHeader';
import TaskFilters from './TaskFilters';

type View = 'inbox' | 'today' | 'upcoming' | 'list' | 'swipe' | 'calendar' | 'settings' | 'webhooks' | 'boards' | 'filters' | 'categories' | 'kanban' | 'people';

export default function Dashboard() {
  const { data: session } = useSession();
  const [view, setView] = useState<View>('today');
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [currentCollection, setCurrentCollection] = useState<any>(null);
  const [taskCounts, setTaskCounts] = useState({
    inbox: 0,
    today: 0,
    upcoming: 0,
  });

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session, searchQuery, activeFilters]);

  // Fetch collection when view is a collection
  useEffect(() => {
    if (view.startsWith('collection-')) {
      const collectionId = view.replace('collection-', '');
      fetchCollection(collectionId);
    } else {
      setCurrentCollection(null);
    }
  }, [view]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilters.status && activeFilters.status.length > 0) params.append('status', activeFilters.status.join(','));
      if (activeFilters.priority && activeFilters.priority.length > 0) params.append('priority', activeFilters.priority.join(','));
      if (activeFilters.tags && activeFilters.tags.length > 0) params.append('tagId', activeFilters.tags.join(','));
      if (activeFilters.boards && activeFilters.boards.length > 0) params.append('boardId', activeFilters.boards.join(','));
      if (activeFilters.categories && activeFilters.categories.length > 0) params.append('categoryId', activeFilters.categories.join(','));
      if (activeFilters.hasDueDate !== null) params.append('hasDueDate', activeFilters.hasDueDate.toString());
      if (activeFilters.isRecurring !== null) params.append('isRecurring', activeFilters.isRecurring.toString());
      if (activeFilters.isInbox !== null) params.append('inbox', activeFilters.isInbox.toString());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      const allTasks = data.tasks || [];
      setTasks(allTasks);
      setFilteredTasks(allTasks);

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
    setFilteredTasks([newTask, ...filteredTasks]);
  };

  const handleTaskUpdated = (updatedTask: any) => {
    setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    setFilteredTasks(filteredTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter((t) => t._id !== taskId));
    setFilteredTasks(filteredTasks.filter((t) => t._id !== taskId));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const getFilteredTasks = () => {
    if (searchQuery || Object.values(activeFilters).some(f => (Array.isArray(f) ? f.length > 0 : f !== null))) {
      return filteredTasks;
    }

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
    <div className="flex h-screen bg-[var(--md-surface)] overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={setView as any}
        taskCounts={taskCounts}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--md-surface-variant)]">
        {/* App Bar - Any.do style */}
        <div className="bg-[var(--md-surface)] md-elevation-1 px-4 md:px-8 py-4 z-10 border-b border-[var(--md-outline-variant)]">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <h1 className="md-headline-medium text-[var(--md-on-surface)] font-medium">
                {view === 'today' ? 'My Day' : 
                 view === 'upcoming' ? 'Next 7 Days' : 
                 view === 'inbox' ? 'Inbox' : 
                 view === 'list' ? 'All Tasks' : 
                 view === 'kanban' || view === 'people' ? 'People' : 
                 view.charAt(0).toUpperCase() + view.slice(1)}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>

        {/* Content Area - Any.do style with centered content */}
        <div className="flex-1 overflow-y-auto md-scrollbar">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
          {view === 'kanban' || view === 'people' ? (
            <div className="h-full">
              <KanbanBoard
                tasks={tasks.filter((t) => t.status !== 'completed')}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onTaskCreated={handleTaskCreated}
              />
            </div>
          ) : (
            <>
              {view === 'inbox' && (
                <InboxView
                  onTaskUpdated={handleTaskUpdated}
                  onTaskDeleted={handleTaskDeleted}
                />
              )}

              {(view === 'list' || view === 'today' || view === 'upcoming') && (
                <>
                  {/* Task Input - Any.do style */}
                  <div className="mb-6">
                    <TaskInput onTaskCreated={handleTaskCreated} />
                  </div>

                  {/* Task List */}
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
                        tasks={getFilteredTasks()}
                        onTaskUpdated={handleTaskUpdated}
                        onTaskDeleted={handleTaskDeleted}
                      />
                    )}
                  </div>
                </>
              )}

              {view === 'swipe' && (
                <div>
                  {loading ? (
                    <div className="text-center py-12 text-[var(--md-on-surface-variant)]">Loading tasks...</div>
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
                <div className="md-card-elevated p-6">
                  <h2 className="md-headline-small text-[var(--md-on-surface)] mb-4">Categories</h2>
                  <p className="md-body-medium text-[var(--md-on-surface-variant)]">Category management coming soon...</p>
                </div>
              )}

              {view === 'filters' && (
                <TaskFilters
                  allTasks={tasks}
                  onFilterChange={handleFilterChange}
                />
              )}
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
