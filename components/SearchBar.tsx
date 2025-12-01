'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Search tasks...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-[var(--md-surface-variant)] border rounded-full transition-all ${
          focused
            ? 'border-[var(--md-primary)] md-elevation-1'
            : 'border-transparent'
        }`}
        style={{ borderRadius: '20px' }}
      >
        <Search className="w-4 h-4 text-[var(--md-on-surface-variant)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none md-body-medium"
          style={{ caretColor: 'var(--md-primary)' }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-colors rounded-full hover:bg-[var(--md-surface)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
