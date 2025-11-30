'use client';

import { useState } from 'react';
import { parseTaskFromNLP } from '@/lib/nlp/taskParser';
import CadenceScheduler from './CadenceScheduler';
import CategoryTree from './CategoryTree';

interface TaskInputProps {
  onTaskCreated: (task: any) => void;
  boardId?: string;
}

export default function TaskInput({ onTaskCreated, boardId }: TaskInputProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      // First, try to get ML predictions
      let mlPredictions = null;
      try {
        const learnRes = await fetch('/api/tasks/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskTitle: input }),
        });
        mlPredictions = await learnRes.json();
      } catch (error) {
        console.error('ML prediction failed:', error);
      }

      // Create task with NLP parsing
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          ...(boardId && { boardId }),
          ...(selectedCategoryId && { categoryId: selectedCategoryId }),
          ...(mlPredictions?.predictedTags && { tags: mlPredictions.predictedTags }),
          ...(mlPredictions?.predictedSchedule && { scheduledDate: mlPredictions.predictedSchedule }),
          ...(mlPredictions?.predictedPriority && { priority: mlPredictions.predictedPriority }),
          ...(showRecurring && recurringPattern && {
            isRecurring: true,
            recurringPattern: {
              ...recurringPattern,
              cadence: recurringPattern.cadence || undefined,
            },
          }),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      const data = await res.json();
      onTaskCreated(data.task);
      setInput('');
      setSuggestions(null);
      setShowRecurring(false);
      setRecurringPattern(null);
      setSelectedCategoryId(null);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Get ML suggestions as user types (debounced)
    if (value.length > 5) {
      try {
        const res = await fetch('/api/tasks/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskTitle: value }),
        });
        const predictions = await res.json();
        setSuggestions(predictions);
      } catch (error) {
        // Silently fail for suggestions
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-4 shadow-sm" style={{ borderRadius: '12px' }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            id="task-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Add a task... (e.g., Pay heating bill urgent due tomorrow)"
            className="w-full px-4 py-3 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-base"
            disabled={loading}
          />
          {suggestions && suggestions.predictedTags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Suggested:</span>
              {suggestions.predictedTags.map((tag: string) => (
                <button
                  key={tag}
                  type="button"
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {(showRecurring || selectedCategoryId) && (
          <div className="pt-2 border-t border-gray-200 space-y-3">
            {showRecurring && (
              <CadenceScheduler
                onCadenceSelect={setRecurringPattern}
              />
            )}

            <CategoryTree
              selectedCategoryId={selectedCategoryId || undefined}
              onCategorySelect={setSelectedCategoryId}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showRecurring}
                onChange={(e) => setShowRecurring(e.target.checked)}
                className="mr-2 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-600">Recurring</span>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            style={{
              backgroundColor: 'var(--primary-color)',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'var(--primary-color-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-color)';
            }}
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

