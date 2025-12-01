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
        className={`flex items-center gap-2 px-3 py-2 bg-[#2c2c2e] border rounded-full transition-all ${
          focused
            ? 'border-blue-500 md-elevation-1'
            : 'border-transparent'
        }`}
        style={{ borderRadius: '20px' }}
      >
        <Search className="w-4 h-4 text-gray-400" />
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
          className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus:outline-none ios-body"
          style={{ caretColor: '#007AFF' }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-[#38383a]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
