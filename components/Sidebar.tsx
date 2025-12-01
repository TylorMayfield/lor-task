'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckSquare2, Users, Sun, Menu, X, Inbox, Star, Folder, Plus } from 'lucide-react';
import CollectionContextMenu from './CollectionContextMenu';
import * as LucideIcons from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  taskCounts?: {
    inbox?: number;
    today?: number;
    upcoming?: number;
  };
  onTaskDroppedOnCollection?: (taskId: string, collectionId: string) => void;
  draggedTaskId?: string | null;
  onCollectionDroppedOnCollection?: (collectionId: string, parentId: string) => void;
}

export default function Sidebar({ currentView, onViewChange, taskCounts, onTaskDroppedOnCollection, draggedTaskId, onCollectionDroppedOnCollection }: SidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    collection: any;
    position: { x: number; y: number };
  } | null>(null);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);
  const [draggedCollectionId, setDraggedCollectionId] = useState<string | null>(null);
  const [isDraggingOverRoot, setIsDraggingOverRoot] = useState(false);

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

  // Build tree structure for nested collections
  const buildCollectionTree = (collections: any[]): any[] => {
    const collectionMap = new Map();
    const rootCollections: any[] = [];

    // First pass: create map of all collections
    collections.forEach((collection) => {
      collectionMap.set(collection._id.toString(), { ...collection, children: [] });
    });

    // Second pass: build tree
    collections.forEach((collection) => {
      const collectionNode = collectionMap.get(collection._id.toString());
      if (collection.parentId) {
        const parentId = typeof collection.parentId === 'object' 
          ? collection.parentId._id.toString() 
          : collection.parentId.toString();
        const parent = collectionMap.get(parentId);
        if (parent) {
          parent.children.push(collectionNode);
        } else {
          // Parent not found, treat as root
          rootCollections.push(collectionNode);
        }
      } else {
        rootCollections.push(collectionNode);
      }
    });

    return rootCollections;
  };

  const renderCollectionTree = (collections: any[], level: number = 0): JSX.Element[] => {
    return collections.map((collection) => {
      const IconComponent = getIconComponent(collection.icon);
      const isActive = currentView === `collection/${collection._id}`;
      const isRenaming = renamingCollectionId === collection._id;
      const isDragged = draggedCollectionId === collection._id;

      return (
        <div key={collection._id} className="relative">
          {isRenaming ? (
            <input
              type="text"
              value={renamingName}
              onChange={(e) => setRenamingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameCollection(collection._id, renamingName.trim());
                } else if (e.key === 'Escape') {
                  setRenamingCollectionId(null);
                  setRenamingName('');
                }
              }}
              onBlur={() => {
                if (renamingName.trim() && renamingName.trim() !== collection.name) {
                  handleRenameCollection(collection._id, renamingName.trim());
                } else {
                  setRenamingCollectionId(null);
                  setRenamingName('');
                }
              }}
              autoFocus
              className="w-full px-3 py-2 bg-[var(--md-surface)] border border-[var(--md-primary)] rounded-lg text-[var(--md-on-surface)] md-body-medium focus:outline-none"
              style={{ borderRadius: '8px', marginLeft: `${level * 16}px` }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              draggable
              onDragStart={(e: any) => {
                const dragEvent = e as DragEvent;
                setDraggedCollectionId(collection._id);
                if (dragEvent.dataTransfer) {
                  dragEvent.dataTransfer.effectAllowed = 'move';
                  dragEvent.dataTransfer.setData('text/plain', collection._id);
                  dragEvent.dataTransfer.setData('application/json', JSON.stringify({ type: 'collection', id: collection._id }));
                }
                const target = e.currentTarget as HTMLElement;
                if (target) {
                  target.style.opacity = '0.5';
                }
              }}
              onDragEnd={(e: any) => {
                setDraggedCollectionId(null);
                setIsDraggingOverRoot(false);
                setDragOverCollectionId(null);
                const target = e.currentTarget as HTMLElement;
                if (target) {
                  target.style.opacity = '1';
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (draggedCollectionId && draggedCollectionId !== collection._id) {
                  setDragOverCollectionId(collection._id);
                  setIsDraggingOverRoot(false);
                  e.dataTransfer.dropEffect = 'move';
                } else if (draggedTaskId) {
                  setDragOverCollectionId(collection._id);
                  setIsDraggingOverRoot(false);
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only clear if we're actually leaving the collection area
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                  setDragOverCollectionId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverCollectionId(null);
                setIsDraggingOverRoot(false);
                
                const dataType = e.dataTransfer.getData('application/json');
                if (dataType) {
                  try {
                    const data = JSON.parse(dataType);
                    if (data.type === 'collection' && data.id && onCollectionDroppedOnCollection) {
                      // Prevent dropping on itself or creating circular references
                      if (data.id !== collection._id) {
                        onCollectionDroppedOnCollection(data.id, collection._id);
                      }
                    }
                  } catch (err) {
                    // Not a collection, might be a task
                    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                    if (taskId && onTaskDroppedOnCollection) {
                      onTaskDroppedOnCollection(taskId, collection._id);
                    }
                  }
                } else {
                  const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                  if (taskId && onTaskDroppedOnCollection) {
                    onTaskDroppedOnCollection(taskId, collection._id);
                  }
                }
              }}
              className={`w-full transition-all ${
                dragOverCollectionId === collection._id
                  ? 'bg-[var(--md-primary-container)] border-2 border-[var(--md-primary)] border-dashed'
                  : ''
              } ${isDragged ? 'opacity-50' : ''}`}
              style={{ 
                borderRadius: '8px', 
                marginLeft: `${level * 16}px`,
                border: dragOverCollectionId === collection._id ? '2px dashed var(--md-primary)' : '2px solid transparent',
                padding: dragOverCollectionId === collection._id ? '2px' : '0',
              }}
            >
              <button
                onClick={() => handleViewChange(`collection/${collection._id}`)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleCollectionDoubleClick(collection);
                }}
                onContextMenu={(e) => handleCollectionContextMenu(e, collection)}
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
            </div>
          )}
          {collection.children && collection.children.length > 0 && (
            <div className="ml-4">
              {renderCollectionTree(collection.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      setIsCreatingCollection(false);
      setNewCollectionName('');
      return;
    }

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create collection');
      }

      const data = await res.json();
      setCollections([...collections, data.collection]);
      setNewCollectionName('');
      setIsCreatingCollection(false);
      // Switch to the new collection view
      onViewChange(`collection/${data.collection._id}`);
    } catch (error: any) {
      console.error('Failed to create collection:', error);
      alert(error.message || 'Failed to create collection. Please try again.');
    }
  };

  const handleRenameCollection = async (collectionId: string, newName: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) {
        throw new Error('Failed to rename collection');
      }

      const data = await res.json();
      setCollections(collections.map((c) => 
        c._id === collectionId ? data.collection : c
      ));
      setRenamingCollectionId(null);
    } catch (error) {
      console.error('Failed to rename collection:', error);
      alert('Failed to rename collection. Please try again.');
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete collection');
      }

      setCollections(collections.filter((c) => c._id !== collectionId));
      // If we're viewing this collection, switch to today view
      if (currentView === `collection/${collectionId}`) {
        onViewChange('today');
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection. Please try again.');
    }
  };

  const handleMoveToRoot = async (collectionId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: null }),
      });

      if (!res.ok) {
        throw new Error('Failed to move collection to root');
      }

      const data = await res.json();
      setCollections(collections.map((c) => 
        c._id === collectionId ? data.collection : c
      ));
    } catch (error) {
      console.error('Failed to move collection to root:', error);
      alert('Failed to move collection to root. Please try again.');
    }
  };

  const handleCollectionDoubleClick = (collection: any) => {
    setRenamingCollectionId(collection._id);
    setRenamingName(collection.name);
  };

  const handleCollectionContextMenu = (e: React.MouseEvent, collection: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      collection,
      position: { x: e.clientX, y: e.clientY },
    });
  };
  
  const handleViewChange = (viewId: string) => {
    onViewChange(viewId);
    setIsOpen(false);
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
                  onClick={() => handleViewChange(item.id)}
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
              {!isCreatingCollection && (
                <button
                  onClick={() => {
                    setIsCreatingCollection(true);
                    setNewCollectionName('');
                  }}
                  className="p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] rounded transition-colors"
                  title="Create a collection"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            {loadingCollections ? (
              <div className="px-3 py-2 text-center">
                <p className="md-body-small text-[var(--md-on-surface-variant)]">Loading...</p>
              </div>
            ) : (
              <div 
                className="space-y-1 relative min-h-[60px]"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (draggedCollectionId) {
                    // Only show root drop zone if not over a collection
                    if (!dragOverCollectionId) {
                      setIsDraggingOverRoot(true);
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Check if we're actually leaving the root drop zone
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    setIsDraggingOverRoot(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverRoot(false);
                  
                  // Only handle if it's a collection being dropped (not on another collection)
                  if (dragOverCollectionId) {
                    return; // Let the collection handle it
                  }
                  
                  const dataType = e.dataTransfer.getData('application/json');
                  if (dataType) {
                    try {
                      const data = JSON.parse(dataType);
                      if (data.type === 'collection' && data.id && onCollectionDroppedOnCollection) {
                        // Move to root (parentId = null/empty string)
                        onCollectionDroppedOnCollection(data.id, '');
                      }
                    } catch (err) {
                      // Not a collection
                    }
                  }
                  
                  // Also check plain text data (fallback)
                  const plainData = e.dataTransfer.getData('text/plain');
                  if (plainData && draggedCollectionId && onCollectionDroppedOnCollection) {
                    onCollectionDroppedOnCollection(plainData, '');
                  }
                }}
              >
                {/* Root drop zone indicator */}
                {isDraggingOverRoot && draggedCollectionId && (
                  <div className="absolute inset-0 border-2 border-dashed border-[var(--md-secondary)] bg-[var(--md-secondary-container)] bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none z-10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--md-secondary-container)] rounded-lg shadow-lg">
                      <Folder className="w-5 h-5 text-[var(--md-on-secondary-container)]" />
                      <span className="md-label-large font-medium text-[var(--md-on-secondary-container)]">
                        Move to root
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Subtle hint when dragging but not over root */}
                {draggedCollectionId && !isDraggingOverRoot && !dragOverCollectionId && (
                  <div className="absolute inset-0 border-2 border-dashed border-[var(--md-outline-variant)] rounded-lg flex items-center justify-center pointer-events-none z-0 opacity-40">
                    <div className="flex items-center gap-2 px-3 py-1">
                      <Folder className="w-4 h-4 text-[var(--md-on-surface-variant)]" />
                      <span className="md-label-small text-[var(--md-on-surface-variant)]">
                        Drop here to move to root
                      </span>
                    </div>
                  </div>
                )}
                
                {renderCollectionTree(buildCollectionTree(collections))}
                
                {/* Inline create collection input */}
                {isCreatingCollection && (
                  <div className="px-3 py-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateCollection();
                        } else if (e.key === 'Escape') {
                          setIsCreatingCollection(false);
                          setNewCollectionName('');
                        }
                      }}
                      onBlur={handleCreateCollection}
                      placeholder="Collection name..."
                      autoFocus
                      className="w-full px-3 py-2 bg-[var(--md-surface)] border border-[var(--md-primary)] rounded-lg text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] md-body-medium focus:outline-none"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

        </nav>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CollectionContextMenu
          collection={contextMenu.collection}
          position={contextMenu.position}
          onRename={handleRenameCollection}
          onDelete={handleDeleteCollection}
          onMoveToRoot={handleMoveToRoot}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
