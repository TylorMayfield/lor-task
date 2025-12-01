import { patternLearner } from './patternLearner';
import Task from '../models/Task';
import Tag from '../models/Tag';
import connectDB from '../mongodb';

interface AutocompleteSuggestion {
  text: string;
  type: 'tag' | 'task' | 'label' | 'pattern';
  confidence: number;
  metadata?: any;
}

export class AutocompleteEngine {
  /**
   * Get autocomplete suggestions based on partial input
   */
  async getSuggestions(
    userId: string,
    input: string,
    limit: number = 10
  ): Promise<AutocompleteSuggestion[]> {
    if (!input || input.length < 2) {
      return [];
    }

    const suggestions: AutocompleteSuggestion[] = [];
    const lowerInput = input.toLowerCase().trim();

    // Get tag suggestions
    const tagSuggestions = await this.getTagSuggestions(userId, lowerInput);
    suggestions.push(...tagSuggestions);

    // Get task title suggestions (from similar tasks)
    const taskSuggestions = await this.getTaskSuggestions(userId, lowerInput);
    suggestions.push(...taskSuggestions);

    // Get pattern-based suggestions
    const patternSuggestions = await this.getPatternSuggestions(userId, lowerInput);
    suggestions.push(...patternSuggestions);

    // Sort by confidence and return top results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Get tag suggestions based on existing tags and KNN patterns
   */
  private async getTagSuggestions(
    userId: string,
    input: string
  ): Promise<AutocompleteSuggestion[]> {
    await connectDB();

    // Get all user tags
    const allTags = await Tag.find({ userId }).lean();
    
    // Filter tags that match input
    const matchingTags = allTags.filter((tag) =>
      tag.name.toLowerCase().includes(input)
    );

    // Get KNN-predicted tags for context
    const predictedTags = await patternLearner.predictTags(userId, input);

    const suggestions: AutocompleteSuggestion[] = [];

    // Add exact matches first
    matchingTags.forEach((tag) => {
      const isExactMatch = tag.name.toLowerCase() === input;
      const isPredicted = predictedTags.includes(tag.name);
      
      suggestions.push({
        text: tag.name,
        type: 'tag',
        confidence: isExactMatch ? 0.9 : isPredicted ? 0.7 : 0.5,
        metadata: { tagId: tag._id },
      });
    });

    // Add predicted tags that aren't already in suggestions
    predictedTags.forEach((tagName) => {
      if (!suggestions.find((s) => s.text === tagName && s.type === 'tag')) {
        suggestions.push({
          text: tagName,
          type: 'tag',
          confidence: 0.6,
        });
      }
    });

    return suggestions;
  }

  /**
   * Get task title suggestions from similar completed tasks
   */
  private async getTaskSuggestions(
    userId: string,
    input: string
  ): Promise<AutocompleteSuggestion[]> {
    await connectDB();

    // Get recent completed tasks with similar titles
    const similarTasks = await Task.find({
      userId,
      status: 'completed',
      title: { $regex: input, $options: 'i' },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    return similarTasks.map((task) => ({
      text: task.title,
      type: 'task' as const,
      confidence: 0.4,
      metadata: { taskId: task._id },
    }));
  }

  /**
   * Get pattern-based suggestions (common patterns from user history)
   */
  private async getPatternSuggestions(
    userId: string,
    input: string
  ): Promise<AutocompleteSuggestion[]> {
    await connectDB();

    // Get common task patterns
    const recentTasks = await Task.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Extract common patterns (e.g., "Pay [bill type] bill")
    const patterns: Record<string, number> = {};
    
    recentTasks.forEach((task) => {
      const words = task.title.toLowerCase().split(/\s+/);
      // Look for patterns like "pay X bill", "call X", etc.
      if (words.length >= 2) {
        const pattern = `${words[0]} ${words[words.length - 1]}`;
        if (input.includes(words[0]) || input.includes(words[words.length - 1])) {
          patterns[pattern] = (patterns[pattern] || 0) + 1;
        }
      }
    });

    return Object.entries(patterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([pattern]) => ({
        text: pattern,
        type: 'pattern' as const,
        confidence: 0.3,
      }));
  }

  /**
   * Get label suggestions (similar to tags but for categorization)
   */
  async getLabelSuggestions(
    userId: string,
    input: string
  ): Promise<AutocompleteSuggestion[]> {
    // Labels are similar to tags but can be hierarchical
    // For now, we'll use tags as labels
    return this.getTagSuggestions(userId, input);
  }

  /**
   * Smart autocomplete that combines all sources
   */
  async getSmartSuggestions(
    userId: string,
    input: string,
    context?: {
      previousWords?: string[];
      currentTags?: string[];
    }
  ): Promise<AutocompleteSuggestion[]> {
    const suggestions = await this.getSuggestions(userId, input, 15);

    // Boost suggestions that match context
    if (context) {
      suggestions.forEach((suggestion) => {
        if (context.currentTags?.includes(suggestion.text)) {
          suggestion.confidence += 0.2;
        }
        if (context.previousWords?.some((word) => suggestion.text.includes(word))) {
          suggestion.confidence += 0.1;
        }
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }
}

export const autocompleteEngine = new AutocompleteEngine();

