import Task, { ITask } from '../models/Task';
import Tag from '../models/Tag';
import RecurringTaskHistory from '../models/RecurringTaskHistory';
import mongoose from 'mongoose';

interface TaskFeature {
  title: string;
  description?: string;
  priority: string;
  tags: string[];
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  hour?: number;
}

interface PatternMatch {
  task: ITask;
  similarity: number;
  predictedTags?: string[];
  predictedSchedule?: Date;
  predictedPriority?: string;
}

export class PatternLearner {
  private k: number = 5; // Number of neighbors for KNN

  /**
   * Extract features from a task for ML
   */
  private extractFeatures(task: ITask): TaskFeature {
    const date = task.scheduledDate || task.dueDate || task.createdAt;
    const taskDate = new Date(date);

    return {
      title: task.title.toLowerCase(),
      description: task.description?.toLowerCase() || '',
      priority: task.priority,
      tags: (task.tags as any[]).map((t) => (typeof t === 'string' ? t : t.name || t._id?.toString() || '')),
      dayOfWeek: taskDate.getDay(),
      dayOfMonth: taskDate.getDate(),
      month: taskDate.getMonth(),
      hour: taskDate.getHours(),
    };
  }

  /**
   * Calculate similarity between two task features using cosine similarity
   */
  private calculateSimilarity(feature1: TaskFeature, feature2: TaskFeature): number {
    // Title similarity (Jaccard similarity on words)
    const words1 = new Set(feature1.title.split(/\s+/));
    const words2 = new Set(feature2.title.split(/\s+/));
    const intersection = new Set(Array.from(words1).filter((x) => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);
    const titleSimilarity = intersection.size / union.size;

    // Tag similarity
    const tags1 = new Set(feature1.tags);
    const tags2 = new Set(feature2.tags);
    const tagIntersection = new Set(Array.from(tags1).filter((x) => tags2.has(x)));
    const tagUnion = new Set([...Array.from(tags1), ...Array.from(tags2)]);
    const tagSimilarity = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;

    // Priority match
    const priorityMatch = feature1.priority === feature2.priority ? 1 : 0;

    // Temporal similarity (day of week, day of month)
    const dayOfWeekSimilarity = feature1.dayOfWeek === feature2.dayOfWeek ? 1 : 0.5;
    const dayOfMonthSimilarity = Math.abs(feature1.dayOfMonth - feature2.dayOfMonth) <= 3 ? 1 : 0;

    // Weighted combination
    return (
      titleSimilarity * 0.4 +
      tagSimilarity * 0.3 +
      priorityMatch * 0.1 +
      dayOfWeekSimilarity * 0.1 +
      dayOfMonthSimilarity * 0.1
    );
  }

  /**
   * Find K nearest neighbors using KNN algorithm
   */
  async findSimilarTasks(
    userId: string,
    taskFeature: TaskFeature,
    limit: number = this.k
  ): Promise<PatternMatch[]> {
    await mongoose.connect(process.env.MONGODB_URI!);

    // Get all completed tasks for the user
    const completedTasks = await Task.find({
      userId,
      status: 'completed',
    })
      .populate('tags')
      .lean();

    // Calculate similarities
    const similarities: PatternMatch[] = completedTasks.map((task) => {
      const taskFeature2 = this.extractFeatures(task as unknown as ITask);
      const similarity = this.calculateSimilarity(taskFeature, taskFeature2);
      return {
        task: task as unknown as ITask,
        similarity,
      };
    });

    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter((m) => m.similarity > 0.3); // Only return reasonably similar tasks
  }

  /**
   * Predict tags for a new task based on similar tasks
   */
  async predictTags(userId: string, taskTitle: string, taskDescription?: string): Promise<string[]> {
    const taskFeature: TaskFeature = {
      title: taskTitle.toLowerCase(),
      description: taskDescription?.toLowerCase() || '',
      priority: 'medium',
      tags: [],
      dayOfWeek: new Date().getDay(),
      dayOfMonth: new Date().getDate(),
      month: new Date().getMonth(),
    };

    const similarTasks = await this.findSimilarTasks(userId, taskFeature, 15);

    // Count tag frequencies from similar tasks with weighted similarity
    const tagCounts: Record<string, number> = {};
    similarTasks.forEach((match) => {
      const tags = (match.task.tags as any[]).map((t) =>
        typeof t === 'string' ? t : t.name || t._id?.toString() || ''
      );
      tags.forEach((tag) => {
        if (tag) {
          // Weight by similarity score
          tagCounts[tag] = (tagCounts[tag] || 0) + match.similarity;
        }
      });
    });

    // Also check for common tag patterns in title
    const titleWords = taskTitle.toLowerCase().split(/\s+/);
    const commonTagPatterns: Record<string, string[]> = {
      bill: ['finance', 'bills', 'payment'],
      meeting: ['work', 'meetings'],
      call: ['work', 'communication'],
      email: ['work', 'communication'],
      exercise: ['health', 'fitness'],
      doctor: ['health', 'medical'],
      buy: ['shopping', 'purchases'],
      read: ['books', 'learning'],
    };

    titleWords.forEach((word) => {
      Object.entries(commonTagPatterns).forEach(([pattern, tags]) => {
        if (word.includes(pattern)) {
          tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 0.3;
          });
        }
      });
    });

    // Return top tags by weighted frequency
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([tag]) => tag);
  }

  /**
   * Predict optimal schedule date based on similar tasks
   */
  async predictSchedule(userId: string, taskTitle: string): Promise<Date | null> {
    const taskFeature: TaskFeature = {
      title: taskTitle.toLowerCase(),
      description: '',
      priority: 'medium',
      tags: [],
      dayOfWeek: new Date().getDay(),
      dayOfMonth: new Date().getDate(),
      month: new Date().getMonth(),
    };

    const similarTasks = await this.findSimilarTasks(userId, taskFeature, 5);

    if (similarTasks.length === 0) {
      return null;
    }

    // Calculate average scheduled date from similar tasks
    const dates = similarTasks
      .map((match) => {
        const date = match.task.scheduledDate || match.task.dueDate || match.task.createdAt;
        return { date: new Date(date), weight: match.similarity };
      })
      .filter((d) => !isNaN(d.date.getTime()));

    if (dates.length === 0) {
      return null;
    }

    // Weighted average of dates
    const totalWeight = dates.reduce((sum, d) => sum + d.weight, 0);
    const avgTime = dates.reduce((sum, d) => sum + d.date.getTime() * d.weight, 0) / totalWeight;

    return new Date(avgTime);
  }

  /**
   * Predict priority based on similar tasks
   */
  async predictPriority(userId: string, taskTitle: string): Promise<string> {
    const taskFeature: TaskFeature = {
      title: taskTitle.toLowerCase(),
      description: '',
      priority: 'medium',
      tags: [],
      dayOfWeek: new Date().getDay(),
      dayOfMonth: new Date().getDate(),
      month: new Date().getMonth(),
    };

    const similarTasks = await this.findSimilarTasks(userId, taskFeature, 5);

    if (similarTasks.length === 0) {
      return 'medium';
    }

    // Count priority frequencies
    const priorityCounts: Record<string, number> = {};
    similarTasks.forEach((match) => {
      const priority = match.task.priority;
      priorityCounts[priority] = (priorityCounts[priority] || 0) + match.similarity;
    });

    // Return most common priority
    return (
      Object.entries(priorityCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'medium'
    );
  }

  /**
   * Learn patterns from recurring task history
   */
  async learnRecurringPatterns(userId: string): Promise<Record<string, any>> {
    await mongoose.connect(process.env.MONGODB_URI!);

    const histories = await RecurringTaskHistory.find({ userId })
      .populate('taskId')
      .sort({ completedAt: -1 })
      .lean();

    const patterns: Record<string, any> = {};

    // Group by original task
    const taskGroups: Record<string, any[]> = {};
    histories.forEach((history: any) => {
      const taskId = history.originalTaskId?.toString() || history.taskId?._id?.toString();
      if (taskId) {
        if (!taskGroups[taskId]) {
          taskGroups[taskId] = [];
        }
        taskGroups[taskId].push(history);
      }
    });

    // Analyze patterns for each recurring task
    for (const [taskId, taskHistories] of Object.entries(taskGroups)) {
      if (taskHistories.length < 2) continue;

      const dates = taskHistories
        .map((h) => new Date(h.completedAt))
        .sort((a, b) => a.getTime() - b.getTime());

      // Calculate average interval
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const diff = dates[i].getTime() - dates[i - 1].getTime();
        intervals.push(diff / (1000 * 60 * 60 * 24)); // Convert to days
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Detect day of week/month patterns
      const dayOfWeekCounts: Record<number, number> = {};
      const dayOfMonthCounts: Record<number, number> = {};

      dates.forEach((date) => {
        dayOfWeekCounts[date.getDay()] = (dayOfWeekCounts[date.getDay()] || 0) + 1;
        dayOfMonthCounts[date.getDate()] = (dayOfMonthCounts[date.getDate()] || 0) + 1;
      });

      patterns[taskId] = {
        avgInterval,
        preferredDayOfWeek: Object.entries(dayOfWeekCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0],
        preferredDayOfMonth: Object.entries(dayOfMonthCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0],
        frequency: avgInterval < 2 ? 'daily' : avgInterval < 8 ? 'weekly' : avgInterval < 32 ? 'monthly' : 'yearly',
        count: taskHistories.length,
      };
    }

    return patterns;
  }
}

export const patternLearner = new PatternLearner();

