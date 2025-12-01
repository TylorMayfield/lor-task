'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import SemanticHighlighter from './SemanticHighlighter';
import { useDebounce } from '@/hooks/useDebounce';

interface TaskInputProps {
  onTaskCreated: (task: any) => void;
  boardId?: string;
}

interface AutocompleteSuggestion {
  text: string;
  type: 'tag' | 'task' | 'label' | 'pattern';
  confidence: number;
}

export default function TaskInput({ onTaskCreated, boardId }: TaskInputProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(input, 300);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debouncedInput.trim().length >= 2 && focused) {
      fetchSuggestions(debouncedInput);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedInput, focused]);

  const fetchSuggestions = async (query: string) => {
    try {
      const res = await fetch(`/api/tasks/autocomplete?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.suggestions && data.suggestions.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          ...(boardId && { boardId }),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create task');
      }

      const data = await res.json();
      onTaskCreated(data.task);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      alert(error.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.type === 'tag') {
      // Add tag to input
      const words = input.split(' ');
      const lastWord = words[words.length - 1];
      if (lastWord.startsWith('#')) {
        words[words.length - 1] = `#${suggestion.text}`;
      } else {
        words.push(`#${suggestion.text}`);
      }
      setInput(words.join(' '));
    } else {
      // Replace or append task text
      setInput(suggestion.text);
    }
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Sync overlay with input
  useEffect(() => {
    if (overlayRef.current && inputRef.current) {
      const input = inputRef.current;
      const overlay = overlayRef.current;
      const styles = window.getComputedStyle(input);
      overlay.style.width = `${input.offsetWidth}px`;
      overlay.style.height = `${input.offsetHeight}px`;
      overlay.style.fontSize = styles.fontSize;
      overlay.style.fontFamily = styles.fontFamily;
      overlay.style.padding = styles.padding;
      overlay.style.lineHeight = styles.lineHeight;
    }
  }, [input, focused]);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`flex items-center gap-3 px-4 py-3 bg-[#1c1c1e] transition-all ${
            focused
              ? 'shadow-lg border-blue-500'
              : 'shadow-sm border-[#38383a]'
          }`}
          style={{ 
            borderRadius: '12px',
            border: '1px solid',
          }}
        >
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                // Delay to allow suggestion clicks
                setTimeout(() => setFocused(false), 200);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Add a task... (try typing to see AI suggestions)"
              className="w-full px-0 py-1 border-0 bg-transparent text-white placeholder:text-gray-500 focus:outline-none ios-body"
              disabled={loading}
              style={{ caretColor: '#007AFF' }}
            />
            {focused && input && (
              <div
                ref={overlayRef}
                className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre"
                style={{ color: 'transparent', zIndex: 1 }}
              >
                <SemanticHighlighter text={input} />
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && focused && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1e] shadow-xl border border-[#38383a] rounded-xl overflow-hidden z-50"
        >
          <div className="p-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={`${suggestion.type}-${idx}`}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  idx === selectedIndex
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'hover:bg-[#2c2c2e] text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  suggestion.type === 'tag' ? 'bg-green-500' :
                  suggestion.type === 'task' ? 'bg-blue-600' :
                  suggestion.type === 'pattern' ? 'bg-purple-600' :
                  'bg-gray-400'
                }`} />
                <span className="ios-body flex-1">{suggestion.text}</span>
                <span className="ios-footnote text-gray-400">
                  {suggestion.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
