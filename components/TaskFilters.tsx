'use client';

import { useState, useEffect } from 'react';
import { TaskPriority, TaskStatus } from '@/lib/models/Task';
import { X, Filter } from 'lucide-react';

interface TaskFiltersProps {
  tasks: any[];
  onFilterChange: (filteredTasks: any[]) => void;
}

export default function TaskFilters({ tasks, onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    tags: [] as string[],
    boards: [] as string[],
    categories: [] as string[],
    hasDueDate: null as boolean | null,
    isRecurring: null as boolean | null,
    isInbox: null as boolean | null,
  });

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableBoards, setAvailableBoards] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  useEffect(() => {
    // Extract unique tags, boards, and categories from tasks
    const tags = new Set<string>();
    const boards = new Map<string, any>();
    const categories = new Map<string, any>();

    tasks.forEach((task) => {
      if (task.tags) {
        task.tags.forEach((tag: any) => {
          const tagName = typeof tag === 'string' ? tag : tag.name || tag._id;
          if (tagName) tags.add(tagName);
        });
      }
      if (task.boardId && typeof task.boardId === 'object') {
        boards.set(task.boardId._id, task.boardId);
      }
      if (task.categoryId && typeof task.categoryId === 'object') {
        categories.set(task.categoryId._id, task.categoryId);
      }
    });

    setAvailableTags(Array.from(tags));
    setAvailableBoards(Array.from(boards.values()));
    setAvailableCategories(Array.from(categories.values()));
  }, [tasks]);

  useEffect(() => {
    // Apply filters
    let filtered = [...tasks];

    if (filters.status.length > 0) {
      filtered = filtered.filter((task) => filters.status.includes(task.status));
    }

    if (filters.priority.length > 0) {
      filtered = filtered.filter((task) => filters.priority.includes(task.priority));
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((task) => {
        if (!task.tags || task.tags.length === 0) return false;
        return task.tags.some((tag: any) => {
          const tagName = typeof tag === 'string' ? tag : tag.name || tag._id;
          return filters.tags.includes(tagName);
        });
      });
    }

    if (filters.boards.length > 0) {
      filtered = filtered.filter((task) => {
        if (!task.boardId) return false;
        const boardId = typeof task.boardId === 'object' ? task.boardId._id : task.boardId;
        return filters.boards.includes(boardId);
      });
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter((task) => {
        if (!task.categoryId) return false;
        const categoryId = typeof task.categoryId === 'object' ? task.categoryId._id : task.categoryId;
        return filters.categories.includes(categoryId);
      });
    }

    if (filters.hasDueDate !== null) {
      filtered = filtered.filter((task) => {
        if (filters.hasDueDate) {
          return task.dueDate || task.scheduledDate;
        } else {
          return !task.dueDate && !task.scheduledDate;
        }
      });
    }

    if (filters.isRecurring !== null) {
      filtered = filtered.filter((task) => task.isRecurring === filters.isRecurring);
    }

    if (filters.isInbox !== null) {
      filtered = filtered.filter((task) => task.isInbox === filters.isInbox);
    }

    onFilterChange(filtered);
  }, [filters, tasks, onFilterChange]);

  const toggleFilter = (type: keyof typeof filters, value: string | boolean) => {
    setFilters((prev) => {
      if (type === 'hasDueDate' || type === 'isRecurring' || type === 'isInbox') {
        return {
          ...prev,
          [type]: prev[type] === value ? null : value,
        };
      } else {
        const current = prev[type] as string[];
        const newValue = current.includes(value as string)
          ? current.filter((v) => v !== value)
          : [...current, value as string];
        return {
          ...prev,
          [type]: newValue,
        };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      tags: [],
      boards: [],
      categories: [],
      hasDueDate: null,
      isRecurring: null,
      isInbox: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some((filter) => {
    if (Array.isArray(filter)) return filter.length > 0;
    return filter !== null;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Filters & Labels</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium"
            style={{ color: 'var(--primary-color)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary-color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--primary-color)';
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(TaskStatus).map((status) => (
              <button
                key={status}
                onClick={() => toggleFilter('status', status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.status.includes(status)
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  filters.status.includes(status)
                    ? { backgroundColor: 'var(--primary-color)' }
                    : {}
                }
                onMouseEnter={(e) => {
                  if (filters.status.includes(status)) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.status.includes(status)) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                  }
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(TaskPriority).map((priority) => (
              <button
                key={priority}
                onClick={() => toggleFilter('priority', priority)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.priority.includes(priority)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFilter('tags', tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{tag}</span>
                  {filters.tags.includes(tag) && <X className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boards Filter */}
        {availableBoards.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Boards</label>
            <div className="flex flex-wrap gap-2">
              {availableBoards.map((board) => (
                <button
                  key={board._id}
                  onClick={() => toggleFilter('boards', board._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.boards.includes(board._id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {board.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories Filter */}
        {availableCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => toggleFilter('categories', category._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.categories.includes(category._id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boolean Filters */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Other Filters</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasDueDate === true}
                onChange={() => toggleFilter('hasDueDate', true)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Has due date</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isRecurring === true}
                onChange={() => toggleFilter('isRecurring', true)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Recurring tasks</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isInbox === true}
                onChange={() => toggleFilter('isInbox', true)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Inbox tasks</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

