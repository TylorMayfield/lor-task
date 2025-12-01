import nlp from 'compromise';
import natural from 'natural';

interface ParsedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  scheduledDate?: Date;
  tags: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
}

const priorityKeywords = {
  urgent: ['urgent', 'asap', 'immediately', 'critical', 'emergency'],
  high: ['important', 'high priority', 'soon', 'priority'],
  low: ['low priority', 'whenever', 'someday', 'maybe'],
};

const recurringKeywords = {
  daily: ['daily', 'every day', 'each day'],
  weekly: ['weekly', 'every week', 'each week'],
  monthly: ['monthly', 'every month', 'each month'],
  yearly: ['yearly', 'annually', 'every year'],
};

export function parseTaskFromNLP(input: string): ParsedTask {
  const doc = nlp(input);
  const lowerInput = input.toLowerCase();

  // Extract priority
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  for (const [level, keywords] of Object.entries(priorityKeywords)) {
    if (keywords.some((keyword) => lowerInput.includes(keyword))) {
      priority = level as 'low' | 'medium' | 'high' | 'urgent';
      break;
    }
  }

  // Extract dates - using compromise's match method for date patterns
  let dueDate: Date | undefined;
  let scheduledDate: Date | undefined;
  
  // Try to extract dates using compromise's match patterns
  try {
    const dateMatches = doc.match('#Date+').out('array');
    const dateTexts: string[] = [];
    
    // Also try to find date-like patterns manually
    const datePatterns = [
      /\b(today|tomorrow|yesterday)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(in|on|by|due|deadline)\s+(\d{1,2}\s+)?(days?|weeks?|months?|years?)\b/gi,
    ];
    
    datePatterns.forEach((pattern) => {
      const matches = input.match(pattern);
      if (matches) {
        dateTexts.push(...matches);
      }
    });
    
    // Parse date strings
    dateTexts.forEach((dateStr) => {
      try {
        // Handle relative dates
        const lowerDateStr = dateStr.toLowerCase();
        let parsedDate: Date | null = null;
        
        if (lowerDateStr.includes('today')) {
          parsedDate = new Date();
        } else if (lowerDateStr.includes('tomorrow')) {
          parsedDate = new Date();
          parsedDate.setDate(parsedDate.getDate() + 1);
        } else if (lowerDateStr.includes('yesterday')) {
          parsedDate = new Date();
          parsedDate.setDate(parsedDate.getDate() - 1);
        } else {
          parsedDate = new Date(dateStr);
        }
        
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          if (lowerInput.includes('due') || lowerInput.includes('deadline') || lowerInput.includes('by')) {
            dueDate = parsedDate;
          } else {
            scheduledDate = parsedDate;
          }
        }
      } catch (err) {
        // Ignore date parsing errors
      }
    });
  } catch (err) {
    // Fallback: try simple date parsing
    try {
      const simpleDateMatch = input.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/);
      if (simpleDateMatch) {
        const parsedDate = new Date(simpleDateMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          if (lowerInput.includes('due') || lowerInput.includes('deadline')) {
            dueDate = parsedDate;
          } else {
            scheduledDate = parsedDate;
          }
        }
      }
    } catch (fallbackErr) {
      // Ignore
    }
  }

  // Extract recurring pattern
  let isRecurring = false;
  let recurringPattern: { frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; interval: number } | undefined;

  for (const [frequency, keywords] of Object.entries(recurringKeywords)) {
    if (keywords.some((keyword) => lowerInput.includes(keyword))) {
      isRecurring = true;
      recurringPattern = {
        frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
        interval: 1,
      };
      break;
    }
  }

  // Extract tags (common categories)
  const tags: string[] = [];
  const categoryKeywords: Record<string, string[]> = {
    work: ['work', 'job', 'office', 'meeting', 'project'],
    personal: ['personal', 'home', 'family'],
    health: ['health', 'exercise', 'workout', 'doctor', 'appointment'],
    finance: ['bill', 'payment', 'expense', 'budget', 'money', 'heating', 'electric', 'utilities'],
    shopping: ['buy', 'purchase', 'shopping', 'grocery'],
    travel: ['travel', 'trip', 'flight', 'hotel'],
  };

  for (const [tag, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerInput.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Clean up the title (remove date/time mentions, priority words)
  let title = input;
  
  // Remove date patterns from title
  const datePatternsToRemove = [
    /\b(today|tomorrow|yesterday)\b/gi,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g,
  ];
  
  datePatternsToRemove.forEach((pattern) => {
    title = title.replace(pattern, '').trim();
  });
  
  priorityKeywords.urgent.concat(priorityKeywords.high, priorityKeywords.low).forEach((keyword) => {
    title = title.replace(new RegExp(keyword, 'gi'), '').trim();
  });

  title = title.replace(/\b(due|deadline|schedule|on|at)\b/gi, '').trim();
  title = title.replace(/\s+/g, ' ').trim();

  return {
    title: title || input,
    priority,
    dueDate,
    scheduledDate,
    tags,
    isRecurring,
    recurringPattern,
  };
}

export function extractTagsFromText(text: string, existingTags: string[] = []): string[] {
  const tags: string[] = [];
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];

  // Use TF-IDF or simple keyword matching
  const categoryKeywords: Record<string, string[]> = {
    work: ['work', 'job', 'office', 'meeting', 'project', 'task', 'deadline'],
    personal: ['personal', 'home', 'family', 'friend'],
    health: ['health', 'exercise', 'workout', 'doctor', 'appointment', 'medical'],
    finance: ['bill', 'payment', 'expense', 'budget', 'money', 'heating', 'electric', 'utilities', 'rent'],
    shopping: ['buy', 'purchase', 'shopping', 'grocery', 'store'],
    travel: ['travel', 'trip', 'flight', 'hotel', 'vacation'],
    urgent: ['urgent', 'asap', 'critical', 'emergency'],
  };

  for (const [tag, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => tokens.includes(keyword) || text.toLowerCase().includes(keyword))) {
      if (!tags.includes(tag) && !existingTags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  return tags;
}

