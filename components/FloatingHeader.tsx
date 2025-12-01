'use client';

import { Search, MoreVert, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import SearchBar from './SearchBar';

interface FloatingHeaderProps {
  viewTitle: string;
  viewIcon: React.ReactNode;
  onSearch: (query: string) => void;
  userAvatars?: Array<{ id: string; name: string; email?: string }>;
}

export default function FloatingHeader({ viewTitle, viewIcon, onSearch, userAvatars = [] }: FloatingHeaderProps) {
  const { data: session } = useSession();
  const [showSearch, setShowSearch] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="md-surface md-elevation-2 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-[var(--md-primary)]">{viewIcon}</div>
          <h1 className="md-headline-small text-[var(--md-on-surface)]">{viewTitle}</h1>
          {userAvatars.length > 0 && (
            <div className="flex items-center -space-x-2">
              {userAvatars.slice(0, 7).map((user) => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] flex items-center justify-center text-xs font-medium border-2 border-[var(--md-surface)] md-elevation-1"
                  title={user.name}
                >
                  {getInitials(user.name)}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="w-64">
              <SearchBar onSearch={onSearch} />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] rounded-full transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          {showSearch && (
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] rounded-full transition-colors">
            <MoreVert className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
