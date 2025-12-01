'use client';

import { useMemo } from 'react';
import nlp from 'compromise';

interface Highlight {
  start: number;
  end: number;
  type: 'date' | 'tag' | 'priority' | 'recurring';
  text: string;
  value?: any;
}

interface SemanticHighlighterProps {
  text: string;
  className?: string;
}

export default function SemanticHighlighter({ text, className = '' }: SemanticHighlighterProps) {
  const highlights = useMemo(() => {
    if (!text) return [];

    const highlights: Highlight[] = [];
    const lowerText = text.toLowerCase();

    // Priority keywords
    const priorityPatterns = [
      { regex: /\b(urgent|asap|immediately|critical|emergency)\b/gi, type: 'priority' as const, value: 'urgent' },
      { regex: /\b(important|high priority|soon|priority)\b/gi, type: 'priority' as const, value: 'high' },
      { regex: /\b(low priority|whenever|someday|maybe)\b/gi, type: 'priority' as const, value: 'low' },
    ];

    priorityPatterns.forEach(({ regex, type, value }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          type,
          text: match[0],
          value,
        });
      }
    });

    // Tag patterns (#tag or @tag)
    const tagRegex = /[#@](\w+)/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(text)) !== null) {
      highlights.push({
        start: tagMatch.index,
        end: tagMatch.index + tagMatch[0].length,
        type: 'tag',
        text: tagMatch[0],
        value: tagMatch[1],
      });
    }

    // Date patterns - use regex since compromise doesn't have dates() method
    const datePatterns = [
      /\b(today|tomorrow|yesterday)\b/gi,
      /\b(next|this)\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(in|after|on|by|due|deadline)\s+\d+\s+(days?|weeks?|months?|years?)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\b/gi,
      /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
    ];

    datePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'date',
          text: match[0],
          value: match[0],
        });
      }
    });

    // Recurring patterns
    const recurringPatterns = [
      { regex: /\b(daily|every day|each day)\b/gi, type: 'recurring' as const },
      { regex: /\b(weekly|every week|each week)\b/gi, type: 'recurring' as const },
      { regex: /\b(monthly|every month|each month)\b/gi, type: 'recurring' as const },
      { regex: /\b(yearly|annually|every year)\b/gi, type: 'recurring' as const },
    ];

    recurringPatterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          type,
          text: match[0],
        });
      }
    });

    // Sort by start position
    return highlights.sort((a, b) => a.start - b.start);
  }, [text]);

  const getHighlightColor = (type: Highlight['type']) => {
    switch (type) {
      case 'date':
        return 'bg-blue-100 text-blue-700';
      case 'tag':
        return 'bg-purple-100 text-purple-700';
      case 'priority':
        return 'bg-orange-100 text-orange-700';
      case 'recurring':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!text || highlights.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build highlighted text
  const parts: Array<{ text: string; highlight?: Highlight }> = [];
  let lastIndex = 0;

  highlights.forEach((highlight) => {
    // Add text before highlight
    if (highlight.start > lastIndex) {
      parts.push({ text: text.substring(lastIndex, highlight.start) });
    }
    // Add highlighted text
    parts.push({ text: highlight.text, highlight });
    lastIndex = highlight.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex) });
  }

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.highlight) {
          return (
            <span
              key={idx}
              className={`${getHighlightColor(part.highlight.type)} px-1 rounded font-medium`}
              style={{ borderRadius: '4px' }}
            >
              {part.text}
            </span>
          );
        }
        return <span key={idx}>{part.text}</span>;
      })}
    </span>
  );
}

