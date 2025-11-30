import { TaskPriority, TaskStatus, ITask } from '../models/Task';
import { addDays, addWeeks, addMonths, startOfDay, isBefore, isAfter } from 'date-fns';
import { calculateCadenceNextDate, parseCadence } from './cadenceParser';

interface SchedulingContext {
  existingTasks: ITask[];
  userPreferences?: {
    workHours?: { start: number; end: number };
    preferredDays?: number[];
  };
}

export function calculateOptimalSchedule(
  task: Partial<ITask>,
  context: SchedulingContext
): Date | null {
  if (!task.dueDate && !task.scheduledDate) {
    return null;
  }

  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const scheduledDate = task.scheduledDate ? new Date(task.scheduledDate) : null;

  // If there's a scheduled date, use it
  if (scheduledDate) {
    return scheduledDate;
  }

  // If there's a due date, schedule it before the due date
  if (dueDate) {
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // For urgent tasks, schedule as soon as possible
    if (task.priority === TaskPriority.URGENT) {
      return startOfDay(addDays(now, 0));
    }

    // For high priority, schedule within 1-2 days
    if (task.priority === TaskPriority.HIGH) {
      const scheduleDays = Math.min(1, Math.floor(daysUntilDue / 2));
      return startOfDay(addDays(now, scheduleDays));
    }

    // For medium priority, schedule in the middle
    if (task.priority === TaskPriority.MEDIUM) {
      const scheduleDays = Math.floor(daysUntilDue / 2);
      return startOfDay(addDays(now, Math.max(0, scheduleDays)));
    }

    // For low priority, schedule closer to due date
    if (task.priority === TaskPriority.LOW) {
      const scheduleDays = Math.max(0, daysUntilDue - 1);
      return startOfDay(addDays(now, scheduleDays));
    }
  }

  // Default: schedule for today if no other logic applies
  return startOfDay(now);
}

export function buildDailyCalendar(
  userId: string,
  tasks: ITask[],
  targetDate: Date = new Date()
): ITask[] {
  const targetStart = startOfDay(targetDate);
  const targetEnd = addDays(targetStart, 1);

  return tasks
    .filter((task) => {
      if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
        return false;
      }

      const scheduledDate = task.scheduledDate ? new Date(task.scheduledDate) : null;
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;

      // Include tasks scheduled for this day
      if (scheduledDate) {
        const scheduledStart = startOfDay(scheduledDate);
        return scheduledStart >= targetStart && scheduledStart < targetEnd;
      }

      // Include tasks due today
      if (dueDate) {
        const dueStart = startOfDay(dueDate);
        return dueStart >= targetStart && dueStart < targetEnd;
      }

      // Include overdue tasks
      if (dueDate && isBefore(dueDate, targetStart)) {
        return true;
      }

      return false;
    })
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = {
        [TaskPriority.URGENT]: 0,
        [TaskPriority.HIGH]: 1,
        [TaskPriority.MEDIUM]: 2,
        [TaskPriority.LOW]: 3,
      };

      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Then by creation date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

export function calculateNextRecurrence(
  task: ITask,
  lastCompletedDate?: Date
): Date | null {
  if (!task.isRecurring || !task.recurringPattern) {
    return null;
  }

  const baseDate = lastCompletedDate || task.createdAt || new Date();
  const { frequency, interval, cadence } = task.recurringPattern;

  // Handle cadence-based scheduling
  if (cadence) {
    const parsed = parseCadence(cadence);
    if (parsed) {
      return calculateCadenceNextDate(baseDate, parsed);
    }
  }

  // Handle traditional frequency-based scheduling
  switch (frequency) {
    case 'daily':
      return addDays(baseDate, interval || 1);
    case 'weekly':
      if (task.recurringPattern.dayOfWeek !== undefined) {
        const currentDay = baseDate.getDay();
        const targetDay = task.recurringPattern.dayOfWeek;
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        return addDays(baseDate, daysUntilTarget || 7 * (interval || 1));
      }
      return addWeeks(baseDate, interval || 1);
    case 'monthly':
      if (task.recurringPattern.dayOfMonth !== undefined) {
        const nextMonth = addMonths(baseDate, 1);
        nextMonth.setDate(task.recurringPattern.dayOfMonth);
        return nextMonth;
      }
      return addMonths(baseDate, interval || 1);
    case 'yearly':
      return addMonths(baseDate, (interval || 1) * 12);
    default:
      return null;
  }
}

