import { addDays, addWeeks, addMonths, startOfMonth, endOfMonth, getDay, setDay, getWeekOfMonth } from 'date-fns';

export interface CadencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'cadence';
  cadence?: string;
  interval?: number;
  dayOfWeek?: number;
  weekOfMonth?: number;
  dayOfMonth?: number;
}

/**
 * Parse cadence string like "first monday", "last friday", "every 2nd tuesday"
 */
export function parseCadence(cadence: string): CadencePattern | null {
  const lower = cadence.toLowerCase().trim();

  // Match patterns like "first monday", "second tuesday", etc.
  const weekMatch = lower.match(/(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (weekMatch) {
    const weekPosition = weekMatch[1];
    const dayName = weekMatch[2];
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const weekMap: Record<string, number> = {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      last: -1,
    };

    return {
      type: 'cadence',
      cadence,
      dayOfWeek: dayMap[dayName],
      weekOfMonth: weekMap[weekPosition],
    };
  }

  // Match "every 2nd tuesday" or "every 3rd monday"
  const everyMatch = lower.match(/every\s+(\d+)(?:st|nd|rd|th)?\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (everyMatch) {
    const interval = parseInt(everyMatch[1]);
    const dayName = everyMatch[2];
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    return {
      type: 'weekly',
      interval,
      dayOfWeek: dayMap[dayName],
    };
  }

  return null;
}

/**
 * Calculate next occurrence based on cadence
 */
export function calculateCadenceNextDate(
  baseDate: Date,
  pattern: CadencePattern
): Date | null {
  if (pattern.type === 'cadence' && pattern.weekOfMonth && pattern.dayOfWeek !== undefined) {
    const start = startOfMonth(baseDate);
    let targetDate: Date;

    if (pattern.weekOfMonth === -1) {
      // Last occurrence of the month
      const end = endOfMonth(baseDate);
      targetDate = setDay(end, pattern.dayOfWeek, { weekStartsOn: 0 });
      if (targetDate > end) {
        targetDate = addDays(targetDate, -7);
      }
    } else {
      // First, second, third, or fourth occurrence
      targetDate = setDay(start, pattern.dayOfWeek, { weekStartsOn: 0 });
      if (targetDate < start) {
        targetDate = addDays(targetDate, 7);
      }
      targetDate = addWeeks(targetDate, pattern.weekOfMonth - 1);
    }

    // If the calculated date is in the past, move to next month
    if (targetDate <= baseDate) {
      const nextMonth = addMonths(baseDate, 1);
      return calculateCadenceNextDate(nextMonth, pattern);
    }

    return targetDate;
  }

  if (pattern.type === 'weekly' && pattern.interval && pattern.dayOfWeek !== undefined) {
    const currentDay = getDay(baseDate);
    const daysUntilTarget = (pattern.dayOfWeek - currentDay + 7) % 7;
    const nextDate = addDays(baseDate, daysUntilTarget || 7 * pattern.interval);
    return nextDate;
  }

  return null;
}

/**
 * Format cadence for display
 */
export function formatCadence(pattern: CadencePattern): string {
  if (pattern.cadence) {
    return pattern.cadence;
  }

  if (pattern.type === 'weekly' && pattern.interval && pattern.dayOfWeek !== undefined) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (pattern.interval === 1) {
      return `Every ${dayNames[pattern.dayOfWeek]}`;
    }
    return `Every ${pattern.interval} weeks on ${dayNames[pattern.dayOfWeek]}`;
  }

  return '';
}

