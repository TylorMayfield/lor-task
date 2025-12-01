'use client';

import { useState } from 'react';
import { X, Folder } from 'lucide-react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionCreated: (collection: any) => void;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onCollectionCreated,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create collection');
      }

      const data = await res.json();
      onCollectionCreated(data.collection);
      setName('');
      setDescription('');
      onClose();
    } catch (error: any) {
      console.error('Failed to create collection:', error);
      alert(error.message || 'Failed to create collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-[var(--md-surface)] md-elevation-5 rounded-xl p-6 w-full max-w-md mx-4"
        style={{ borderRadius: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="md-title-large text-[var(--md-on-surface)]">
            Create a collection
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="collection-name"
              className="block md-label-medium text-[var(--md-on-surface)] mb-2"
            >
              Name
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects, Personal Goals"
              className="w-full px-4 py-2.5 bg-[var(--md-surface)] border border-[var(--md-outline-variant)] rounded-lg text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:border-[var(--md-primary)] md-body-medium transition-colors"
              style={{ borderRadius: '12px' }}
              autoFocus
              required
            />
          </div>

          <div>
            <label
              htmlFor="collection-description"
              className="block md-label-medium text-[var(--md-on-surface)] mb-2"
            >
              Description (optional)
            </label>
            <textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this collection..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--md-surface)] border border-[var(--md-outline-variant)] rounded-lg text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:border-[var(--md-primary)] md-body-medium transition-colors resize-none"
              style={{ borderRadius: '12px' }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 md-body-medium text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant)] rounded-lg transition-colors"
              style={{ borderRadius: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 bg-[var(--md-primary)] text-[var(--md-on-primary)] md-body-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:md-elevation-2"
              style={{ borderRadius: '12px' }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

