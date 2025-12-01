'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Tag, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KNNSuggestion {
  type: 'schedule' | 'tag' | 'category' | 'priority';
  value: string | Date;
  confidence: number;
  reason?: string;
}

interface KNNSuggestionsProps {
  taskTitle: string;
  taskDescription?: string;
  onScheduleSuggestion?: (date: Date) => void;
  onTagSuggestion?: (tag: string) => void;
  onCategorySuggestion?: (categoryId: string) => void;
  onPrioritySuggestion?: (priority: string) => void;
}

export default function KNNSuggestions({
  taskTitle,
  taskDescription,
  onScheduleSuggestion,
  onTagSuggestion,
  onCategorySuggestion,
  onPrioritySuggestion,
}: KNNSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<KNNSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskTitle.trim().length >= 3) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [taskTitle, taskDescription]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newSuggestions: KNNSuggestion[] = [];

        if (data.predictedSchedule) {
          newSuggestions.push({
            type: 'schedule',
            value: new Date(data.predictedSchedule),
            confidence: data.scheduleConfidence || 0.7,
            reason: 'Similar tasks were scheduled around this time',
          });
        }

        if (data.predictedTags && data.predictedTags.length > 0) {
          data.predictedTags.slice(0, 3).forEach((tag: string, idx: number) => {
            newSuggestions.push({
              type: 'tag',
              value: tag,
              confidence: 0.8 - idx * 0.1,
              reason: 'Found in similar tasks',
            });
          });
        }

        if (data.predictedCategory) {
          newSuggestions.push({
            type: 'category',
            value: data.predictedCategory,
            confidence: data.categoryConfidence || 0.7,
            reason: 'Similar tasks belong to this category',
          });
        }

        if (data.predictedPriority) {
          newSuggestions.push({
            type: 'priority',
            value: data.predictedPriority,
            confidence: data.priorityConfidence || 0.7,
            reason: 'Similar tasks have this priority',
          });
        }

        setSuggestions(newSuggestions.filter((s) => s.confidence > 0.5));
      }
    } catch (error) {
      console.error('Failed to fetch KNN suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="w-4 h-4" />;
      case 'tag':
        return <Tag className="w-4 h-4" />;
      case 'category':
        return <Folder className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleSuggestionClick = (suggestion: KNNSuggestion) => {
    switch (suggestion.type) {
      case 'schedule':
        if (onScheduleSuggestion && suggestion.value instanceof Date) {
          onScheduleSuggestion(suggestion.value);
        }
        break;
      case 'tag':
        if (onTagSuggestion && typeof suggestion.value === 'string') {
          onTagSuggestion(suggestion.value);
        }
        break;
      case 'category':
        if (onCategorySuggestion && typeof suggestion.value === 'string') {
          onCategorySuggestion(suggestion.value);
        }
        break;
      case 'priority':
        if (onPrioritySuggestion && typeof suggestion.value === 'string') {
          onPrioritySuggestion(suggestion.value);
        }
        break;
    }
  };

  const formatValue = (suggestion: KNNSuggestion) => {
    if (suggestion.value instanceof Date) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const suggestionDate = new Date(suggestion.value);
      
      if (suggestionDate.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (suggestionDate.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return suggestionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
    return String(suggestion.value);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mt-3 flex flex-wrap gap-2"
      >
        {suggestions.map((suggestion, idx) => (
          <motion.button
            key={`${suggestion.type}-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleSuggestionClick(suggestion)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-full ios-footnote font-medium hover:bg-blue-600/30 transition-colors border border-blue-800/50"
          >
            <Sparkles className="w-3 h-3" />
            {getIcon(suggestion.type)}
            <span>{formatValue(suggestion)}</span>
            {suggestion.reason && (
              <span className="text-blue-400 opacity-70" title={suggestion.reason}>
                ({Math.round(suggestion.confidence * 100)}%)
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

