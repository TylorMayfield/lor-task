'use client';

import { useState, useEffect } from 'react';
import TaskInput from '../TaskInput';
import TaskList from '../TaskList';

interface CollectionViewProps {
  tasks: any[];
  loading: boolean;
  collection: any;
  onTaskCreated: (task: any) => void;
  onTaskUpdated: (task: any) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragEnd?: () => void;
}

export default function CollectionView({
  tasks,
  loading,
  collection,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskDragStart,
  onTaskDragEnd,
}: CollectionViewProps) {
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  useEffect(() => {
    // First, filter by collectionId if tasks have it set
    let filtered = tasks.filter((t) => {
      // If task has collectionId, it must match this collection
      if (t.collectionId) {
        const taskCollectionId = typeof t.collectionId === 'object' ? t.collectionId._id : t.collectionId;
        return taskCollectionId?.toString() === collection?._id?.toString();
      }
      // If no filterCriteria, show all tasks without collectionId
      if (!collection?.filterCriteria) {
        return true;
      }
      return false;
    });

    // Then apply additional filterCriteria if present
    if (!collection?.filterCriteria) {
      setFilteredTasks(filtered.filter((t) => t.status !== 'completed'));
      return;
    }

    const criteria = collection.filterCriteria;

    if (criteria.tags && criteria.tags.length > 0) {
      filtered = filtered.filter((t) => {
        const taskTags = Array.isArray(t.tags) ? t.tags.map((tag: any) => 
          typeof tag === 'object' ? tag.name || tag._id : tag
        ) : [];
        return criteria.tags.some((tagId: string) => 
          taskTags.some((taskTag: any) => 
            taskTag === tagId || taskTag === tagId.toString()
          )
        );
      });
    }

    if (criteria.priority && criteria.priority.length > 0) {
      filtered = filtered.filter((t) => criteria.priority.includes(t.priority));
    }

    if (criteria.status && criteria.status.length > 0) {
      filtered = filtered.filter((t) => criteria.status.includes(t.status));
    }

    if (criteria.boardId) {
      filtered = filtered.filter((t) => {
        const taskBoardId = typeof t.boardId === 'object' ? t.boardId._id : t.boardId;
        return taskBoardId?.toString() === criteria.boardId.toString();
      });
    }

    if (criteria.categoryId) {
      filtered = filtered.filter((t) => {
        const taskCategoryId = typeof t.categoryId === 'object' ? t.categoryId._id : t.categoryId;
        return taskCategoryId?.toString() === criteria.categoryId.toString();
      });
    }

    if (criteria.hasDueDate !== undefined) {
      filtered = filtered.filter((t) => 
        criteria.hasDueDate ? !!t.dueDate : !t.dueDate
      );
    }

    if (criteria.isRecurring !== undefined) {
      filtered = filtered.filter((t) => t.isRecurring === criteria.isRecurring);
    }

    setFilteredTasks(filtered.filter((t) => t.status !== 'completed'));
  }, [tasks, collection]);

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
          />
        )}
      </div>
    </div>
  );
}

