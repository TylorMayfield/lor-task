'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Edit2, MoreVertical, FolderUp } from 'lucide-react';

interface CollectionContextMenuProps {
  collection: any;
  onRename: (collectionId: string, newName: string) => void;
  onDelete: (collectionId: string) => void;
  onMoveToRoot?: (collectionId: string) => void;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function CollectionContextMenu({
  collection,
  onRename,
  onDelete,
  onMoveToRoot,
  position,
  onClose,
}: CollectionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(collection.name);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleRename = () => {
    setIsRenaming(true);
  };

  const handleRenameSubmit = () => {
    if (newName.trim() && newName.trim() !== collection.name) {
      onRename(collection._id, newName.trim());
    } else {
      setNewName(collection.name);
    }
    setIsRenaming(false);
    onClose();
  };

  const handleRenameCancel = () => {
    setNewName(collection.name);
    setIsRenaming(false);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      onDelete(collection._id);
    }
    onClose();
  };

  const handleMoveToRoot = () => {
    if (onMoveToRoot) {
      onMoveToRoot(collection._id);
    }
    onClose();
  };

  const hasParent = collection.parentId && (typeof collection.parentId === 'object' ? collection.parentId._id : collection.parentId);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--md-surface)] md-elevation-3 rounded-lg overflow-hidden min-w-[160px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        borderRadius: '12px',
      }}
    >
      {isRenaming ? (
        <div className="p-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              } else if (e.key === 'Escape') {
                handleRenameCancel();
              }
            }}
            onBlur={handleRenameSubmit}
            autoFocus
            className="w-full px-3 py-2 bg-[var(--md-surface-variant)] border border-[var(--md-outline-variant)] rounded-lg text-[var(--md-on-surface)] md-body-medium focus:outline-none focus:border-[var(--md-primary)]"
            style={{ borderRadius: '8px' }}
          />
        </div>
      ) : (
        <div className="py-1">
          <button
            onClick={handleRename}
            className="w-full flex items-center gap-3 px-4 py-2 text-left md-body-medium text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </button>
          {hasParent && onMoveToRoot && (
            <button
              onClick={handleMoveToRoot}
              className="w-full flex items-center gap-3 px-4 py-2 text-left md-body-medium text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] transition-colors"
            >
              <FolderUp className="w-4 h-4" />
              Move to root
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-2 text-left md-body-medium text-[var(--md-error)] hover:bg-[var(--md-error-container)] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

