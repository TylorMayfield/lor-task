'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { CalendarDays, CheckSquare2, Users, Sun, Menu, X, Inbox, Folder, Plus } from 'lucide-react';
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
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const navigationItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: taskCounts?.inbox },
    { id: 'today', label: 'Do Today', icon: Sun, count: taskCounts?.today },
    { id: 'upcoming', label: 'Do Tomorrow', icon: CalendarDays, count: taskCounts?.upcoming },
    { id: 'list', label: 'All Tasks', icon: CheckSquare2, count: undefined },
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
      } else if (res.status === 401) {
        console.warn('Unauthorized when fetching collections - user may need to sign in again.');
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
    setEditingCollectionId(collection._id);
    setEditingName(collection.name);
  };

  const handleCreateCollection = async () => {
    if (creatingCollection) return;
    setCreatingCollection(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New collection',
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert('Your session expired. Please sign in again to create collections.');
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          alert(errorData.error || 'Failed to create collection.');
        }
        return;
      }

      const data = await res.json();
      handleCollectionCreated(data.collection);
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleRenameCollection = async (collectionId: string, newName: string) => {
    const trimmed = newName.trim();
    setEditingCollectionId(null);
    if (!trimmed) return;

    // Optimistic update
    const previous = [...collections];
    setCollections(collections.map(c => (c._id === collectionId ? { ...c, name: trimmed } : c)));

    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to rename collection:', errorData.error);
        setCollections(previous);
      }
    } catch (error) {
      console.error('Failed to rename collection:', error);
      setCollections(previous);
    }
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1c1c1e] md-elevation-2 rounded-lg text-white border border-[#38383a]"
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
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1c1c1e] border-r border-[#38383a] h-screen flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header with close button for mobile */}
        <div className="p-4 border-b border-[#38383a] flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white ios-headline font-semibold flex-shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="ios-headline text-white truncate">
                {session?.user?.name || 'User'}
              </h3>
              <p className="ios-footnote text-gray-400">Pro Plan</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-white"
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
                      ? 'bg-blue-600/20 text-blue-500'
                      : 'text-gray-300 hover:bg-[#2c2c2e]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="ios-body font-medium">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full ios-footnote font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2c2c2e] text-gray-300'
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
              <h4 className="ios-footnote text-gray-400 uppercase tracking-wider font-semibold">Collections</h4>
              <button
                onClick={handleCreateCollection}
                className="p-1 text-gray-400 hover:text-white hover:bg-[#2c2c2e] rounded transition-colors disabled:opacity-50"
                disabled={creatingCollection}
                title="Create a collection"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {loadingCollections ? (
              <div className="px-3 py-2 text-center">
                <p className="ios-footnote text-gray-400">Loading...</p>
              </div>
            ) : collections.length > 0 ? (
              <div className="space-y-1">
                {collections.map((collection) => {
                  const IconComponent = getIconComponent(collection.icon);
                  const isActive = currentView === `collection-${collection._id}`;
                  const isEditing = editingCollectionId === collection._id;
                  return (
                    <div
                      key={collection._id}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-500'
                          : 'text-gray-300 hover:bg-[#2c2c2e]'
                      }`}
                      onClick={() => {
                        onViewChange(`collection-${collection._id}`);
                        setIsOpen(false);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingCollectionId(collection._id);
                        setEditingName(collection.name || '');
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleRenameCollection(collection._id, editingName)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameCollection(collection._id, editingName);
                              } else if (e.key === 'Escape') {
                                setEditingCollectionId(null);
                              }
                            }}
                            className="w-full bg-transparent border-b border-blue-500 focus:outline-none ios-body"
                          />
                        ) : (
                          <span className="ios-body truncate">{collection.name}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-2">
                <p className="ios-footnote text-gray-400 text-center">
                  No collections yet
                </p>
              </div>
            )}
          </div>

          {/* Create Collection Button */}
          <div className="px-2 pt-4 border-t border-[#38383a]">
            <button
              onClick={() => {
                handleCreateCollection();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white ios-body font-semibold rounded-lg transition-all hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create a collection
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
