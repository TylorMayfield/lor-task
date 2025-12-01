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

  // Extract dates using regex patterns (no external plugin needed)
  let datePhrases: string[] = [];
  const datePatterns = [
    /\b(today|tomorrow|yesterday)\b/gi,
    /\b(next|this)\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(in|after)\s+\d+\s+(days?|weeks?|months?|years?)\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
    /\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
  ];

  datePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(input)) !== null) {
      if (!datePhrases.includes(match[0])) {
        datePhrases.push(match[0]);
      }
    }
  });

  let dueDate: Date | undefined;
  let scheduledDate: Date | undefined;

  datePhrases.forEach((dateStr: string) => {
    // Try to parse the date string
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      if (lowerInput.includes('due') || lowerInput.includes('deadline')) {
        dueDate = parsedDate;
      } else {
        scheduledDate = parsedDate;
      }
    }
  });

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
  datePhrases.forEach((phrase: string) => {
    title = title.replace(phrase, '').trim();
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

