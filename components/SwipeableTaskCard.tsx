'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { TaskPriority, TaskStatus } from '@/lib/models/Task';
import { Check } from 'lucide-react';

interface SwipeableTaskCardProps {
  task: any;
  onSwipeLeft?: (task: any) => void;
  onSwipeRight?: (task: any) => void;
  onTap?: (task: any) => void;
  onComplete?: (task: any) => void;
  canEdit?: boolean;
}

export default function SwipeableTaskCard({
  task,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onComplete,
  canEdit = true,
}: SwipeableTaskCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeAction, setSwipeAction] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;
  const SWIPE_VELOCITY_THRESHOLD = 0.5;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchStart = (e: TouchEvent) => {
      setStartX(e.touches[0].clientX);
      setIsDragging(true);
      setSwipeAction(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const current = e.touches[0].clientX;
      setCurrentX(current);
      const diff = current - startX;

      if (Math.abs(diff) > 20) {
        e.preventDefault();
      }

      if (diff > SWIPE_THRESHOLD) {
        setSwipeAction('right');
      } else if (diff < -SWIPE_THRESHOLD) {
        setSwipeAction('left');
      } else {
        setSwipeAction(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      const diff = currentX - startX;
      const velocity = Math.abs(diff) / (Date.now() - (startX as any));

      if (Math.abs(diff) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
        if (diff > 0 && onSwipeRight) {
          onSwipeRight(task);
        } else if (diff < 0 && onSwipeLeft) {
          onSwipeLeft(task);
        }
      }

      setIsDragging(false);
      setCurrentX(0);
      setStartX(0);
      setSwipeAction(null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      setStartX(e.clientX);
      setIsDragging(true);
      setSwipeAction(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const current = e.clientX;
      setCurrentX(current);
      const diff = current - startX;

      if (diff > SWIPE_THRESHOLD) {
        setSwipeAction('right');
      } else if (diff < -SWIPE_THRESHOLD) {
        setSwipeAction('left');
      } else {
        setSwipeAction(null);
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      const diff = currentX - startX;

      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0 && onSwipeRight) {
          onSwipeRight(task);
        } else if (diff < 0 && onSwipeLeft) {
          onSwipeLeft(task);
        }
      }

      setIsDragging(false);
      setCurrentX(0);
      setStartX(0);
      setSwipeAction(null);
    };

    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchmove', handleTouchMove);
    card.addEventListener('touchend', handleTouchEnd);
    card.addEventListener('mousedown', handleMouseDown);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseup', handleMouseUp);
    card.addEventListener('mouseleave', handleMouseUp);

    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', handleTouchEnd);
      card.removeEventListener('mousedown', handleMouseDown);
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseup', handleMouseUp);
      card.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, startX, currentX, onSwipeLeft, onSwipeRight, task]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800 border-red-300';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const translateX = isDragging ? currentX - startX : 0;
  const opacity = isDragging && swipeAction ? 0.7 : 1;

  return (
    <div
      ref={cardRef}
      className={`relative bg-white rounded-lg shadow-md border-2 transition-transform duration-200 ${
        task.status === TaskStatus.COMPLETED ? 'opacity-60' : ''
      } ${getPriorityColor(task.priority)}`}
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
        touchAction: 'pan-y',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onClick={() => onTap && onTap(task)}
    >
      {/* Swipe indicators */}
      {swipeAction === 'left' && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-600 font-bold">
          Delete
        </div>
      )}
      {swipeAction === 'right' && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-600 font-bold">
          Complete
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3
              className={`text-lg font-semibold ${
                task.status === TaskStatus.COMPLETED
                  ? 'line-through text-gray-500'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-gray-600">{task.description}</p>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              {task.tags?.map((tag: any) => (
                <span
                  key={typeof tag === 'string' ? tag : tag._id || tag.name}
                  className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                >
                  {typeof tag === 'string' ? tag : tag.name || tag._id}
                </span>
              ))}
              {task.categoryId && typeof task.categoryId === 'object' && (
                <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                  {task.categoryId.name}
                </span>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {task.dueDate && (
                <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
              )}
              {task.scheduledDate && (
                <span className="ml-4">
                  Scheduled: {format(new Date(task.scheduledDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete && onComplete(task);
              }}
              className={`ml-4 px-3 py-1 rounded text-sm ${
                task.status === TaskStatus.COMPLETED
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {task.status === TaskStatus.COMPLETED ? 'Undo' : <Check className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

