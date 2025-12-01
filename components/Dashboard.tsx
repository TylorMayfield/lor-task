'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
import TodayView from './views/TodayView';
import UpcomingView from './views/UpcomingView';
import ListView from './views/ListView';
import CollectionView from './views/CollectionView';

type View = 'inbox' | 'today' | 'upcoming' | 'list' | 'swipe' | 'calendar' | 'settings' | 'webhooks' | 'boards' | 'filters' | 'categories' | 'kanban' | 'people';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract view from URL path
  const getViewFromPath = (): View => {
    if (!pathname) return 'today';
    // Handle /dashboard or /dashboard/today, etc.
    const path = pathname === '/dashboard' || pathname === '/dashboard/' 
      ? 'today' 
      : pathname.replace('/dashboard/', '').replace(/^\/+/, '') || 'today';
    
    if (path.startsWith('collection/')) {
      return path as View;
    }
    // Get first segment (e.g., 'today' from '/dashboard/today')
    const firstSegment = path.split('/')[0] || 'today';
    return firstSegment as View;
  };
  
  const [view, setView] = useState<View>(() => {
    // Initialize from pathname on mount
    if (typeof window !== 'undefined') {
      return getViewFromPath();
    }
    return 'today';
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [currentCollection, setCurrentCollection] = useState<any>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
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

  // Sync view with URL
  useEffect(() => {
    const urlView = getViewFromPath();
    if (urlView !== view) {
      setView(urlView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Fetch collection when view is a collection
  useEffect(() => {
    if (view.startsWith('collection/')) {
      const collectionId = view.replace('collection/', '');
      fetchCollection(collectionId);
    } else {
      setCurrentCollection(null);
    }
  }, [view]);

  const handleViewChange = (newView: string) => {
    setView(newView as View);
    router.push(`/dashboard/${newView}`);
  };

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

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleTaskDroppedOnCollection = async (taskId: string, collectionId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to move task to collection');
      }

      const data = await res.json();
      handleTaskUpdated(data.task);
      setDraggedTaskId(null);
    } catch (error) {
      console.error('Failed to move task to collection:', error);
      alert('Failed to move task to collection. Please try again.');
      setDraggedTaskId(null);
    }
  };

  const handleCollectionDroppedOnCollection = async (collectionId: string, parentId: string) => {
    try {
      // Prevent circular references - check if parentId is a descendant of collectionId
      // For now, we'll just prevent dropping on itself
      if (collectionId === parentId) {
        return;
      }

      // If parentId is empty string, move to root (set to null)
      const updateData = parentId === '' ? { parentId: null } : { parentId };

      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        throw new Error('Failed to move collection');
      }

      // The sidebar will refetch collections automatically
    } catch (error) {
      console.error('Failed to move collection:', error);
      alert('Failed to move collection. Please try again.');
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const fetchCollection = async (collectionId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentCollection(data.collection);
      }
    } catch (error) {
      console.error('Failed to fetch collection:', error);
      setCurrentCollection(null);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--md-surface)] overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={handleViewChange}
        taskCounts={taskCounts}
        onTaskDroppedOnCollection={handleTaskDroppedOnCollection}
        draggedTaskId={draggedTaskId}
        onCollectionDroppedOnCollection={handleCollectionDroppedOnCollection}
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
                 view.startsWith('collection/') && currentCollection ? currentCollection.name :
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
            <AnimatePresence mode="wait">
              {view === 'kanban' || view === 'people' ? (
                <motion.div
                  key="kanban"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <KanbanBoard
                    tasks={tasks.filter((t) => t.status !== 'completed')}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                    onTaskCreated={handleTaskCreated}
                  />
                </motion.div>
              ) : view === 'today' ? (
                <motion.div
                  key="today"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TodayView
                    tasks={tasks}
                    loading={loading}
                    onTaskCreated={handleTaskCreated}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                  />
                </motion.div>
              ) : view === 'upcoming' ? (
                <motion.div
                  key="upcoming"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <UpcomingView
                    tasks={tasks}
                    loading={loading}
                    onTaskCreated={handleTaskCreated}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                    onTaskDragStart={handleTaskDragStart}
                    onTaskDragEnd={handleTaskDragEnd}
                  />
                </motion.div>
              ) : view === 'list' ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListView
                    tasks={tasks}
                    loading={loading}
                    onTaskCreated={handleTaskCreated}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                    onTaskDragStart={handleTaskDragStart}
                    onTaskDragEnd={handleTaskDragEnd}
                  />
                </motion.div>
              ) : view.startsWith('collection/') ? (
                <motion.div
                  key={`collection-${view}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <CollectionView
                    tasks={tasks}
                    loading={loading}
                    collection={currentCollection}
                    onTaskCreated={handleTaskCreated}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                    onTaskDragStart={handleTaskDragStart}
                    onTaskDragEnd={handleTaskDragEnd}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {view === 'inbox' && (
                    <InboxView
                      onTaskUpdated={handleTaskUpdated}
                      onTaskDeleted={handleTaskDeleted}
                    />
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
