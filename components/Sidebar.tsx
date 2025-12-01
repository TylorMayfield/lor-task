'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { CalendarDays, CheckSquare2, Users, Sun, Menu, X, Inbox, Star, Folder, Plus } from 'lucide-react';
import CreateCollectionModal from './CreateCollectionModal';
import * as LucideIcons from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  taskCounts?: {
    inbox?: number;
    today?: number;
    upcoming?: number;
  };
}

export default function Sidebar({ currentView, onViewChange, taskCounts }: SidebarProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(true);

  const navigationItems = [
    { id: 'today', label: 'My day', icon: Sun, count: taskCounts?.today },
    { id: 'upcoming', label: 'Next 7 days', icon: CalendarDays, count: taskCounts?.upcoming },
    { id: 'list', label: 'All my tasks', icon: CheckSquare2, count: taskCounts?.inbox },
    { id: 'people', label: 'People', icon: Users, count: undefined },
  ];

  // Fetch collections
  useEffect(() => {
    if (session?.user?.id) {
      fetchCollections();
    }
  }, [session?.user?.id]);

  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleCollectionCreated = (collection: any) => {
    setCollections([...collections, collection]);
    // Switch to the new collection view
    onViewChange(`collection-${collection._id}`);
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Folder;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || Folder;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--md-surface)] md-elevation-2 rounded-lg text-[var(--md-on-surface)]"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[var(--md-surface)] border-r border-[var(--md-outline-variant)] h-screen flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header with close button for mobile */}
        <div className="p-4 border-b border-[var(--md-outline-variant)] flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--md-primary)] flex items-center justify-center text-[var(--md-on-primary)] font-medium flex-shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="md-title-small text-[var(--md-on-surface)] truncate">
                {session?.user?.name || 'User'}
              </h3>
              <p className="md-body-small text-[var(--md-on-surface-variant)]">Pro Plan</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto md-scrollbar p-2">
          <div className="space-y-1 mb-6">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]'
                      : 'text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-variant)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-[var(--md-on-primary-container)]' : ''}`} />
                    <span className="md-label-large">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                        : 'bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)]'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Collections Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <h4 className="md-label-medium text-[var(--md-on-surface-variant)] uppercase">Collections</h4>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] rounded transition-colors"
                title="Create a collection"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {loadingCollections ? (
              <div className="px-3 py-2 text-center">
                <p className="md-body-small text-[var(--md-on-surface-variant)]">Loading...</p>
              </div>
            ) : collections.length > 0 ? (
              <div className="space-y-1">
                {collections.map((collection) => {
                  const IconComponent = getIconComponent(collection.icon);
                  const isActive = currentView === `collection-${collection._id}`;
                  return (
                    <button
                      key={collection._id}
                      onClick={() => {
                        onViewChange(`collection-${collection._id}`);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]'
                          : 'text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-variant)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-4 h-4" />
                        <span className="md-body-medium">{collection.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-2">
                <p className="md-body-small text-[var(--md-on-surface-variant)] text-center">
                  No collections yet
                </p>
              </div>
            )}
          </div>

          {/* Create Collection Button */}
          <div className="px-2 pt-4 border-t border-[var(--md-outline-variant)]">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--md-primary)] text-[var(--md-on-primary)] md-body-medium rounded-lg transition-all hover:md-elevation-2"
              style={{ borderRadius: '12px' }}
            >
              <Plus className="w-4 h-4" />
              Create a collection
            </button>
          </div>
        </nav>
      </div>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCollectionCreated={handleCollectionCreated}
      />
    </>
  );
}
