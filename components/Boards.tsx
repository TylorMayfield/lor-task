'use client';

import { useState, useEffect } from 'react';
import BoardDetails from './BoardDetails';
import { LayoutGrid } from 'lucide-react';

interface Board {
  _id: string;
  name: string;
  description?: string;
  color: string;
  isPublic: boolean;
  createdBy: any;
  permission: string;
}

export default function Boards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    isPublic: false,
  });

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data.boards || []);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create board');

      await fetchBoards();
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        isPublic: false,
      });
    } catch (error) {
      console.error('Failed to create board:', error);
      alert('Failed to create board. Please try again.');
    }
  };

  const handleDelete = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board? All tasks will be moved to personal tasks.')) {
      return;
    }

    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete board');

      await fetchBoards();
      if (selectedBoard?._id === boardId) {
        setSelectedBoard(null);
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
      alert('Failed to delete board. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading boards...</div>;
  }

  if (selectedBoard) {
    return (
      <BoardDetails
        board={selectedBoard}
        onBack={() => setSelectedBoard(null)}
        onUpdate={fetchBoards}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Boards</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Board'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Board Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Team Board"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Board description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10 w-20 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="mr-2"
              />
              <span>Public Board (visible to all users)</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-red-500 text-white py-2.5 px-4 rounded-lg hover:bg-red-600 font-medium transition-colors"
          >
            Create Board
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">No boards yet</p>
            <p className="text-sm">Create one to get started!</p>
          </div>
        ) : (
          boards.map((board) => (
            <div
              key={board._id}
              className="task-card cursor-pointer"
              onClick={() => setSelectedBoard(board)}
            >
              <div
                className="h-2 rounded-t-lg mb-3"
                style={{ backgroundColor: board.color }}
              />
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{board.name}</h3>
              {board.description && (
                <p className="text-sm text-gray-600 mb-2">{board.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${
                    board.permission === 'owner'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : board.permission === 'admin'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : board.permission === 'member'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {board.permission}
                </span>
                {board.isPublic && (
                  <span className="text-xs text-gray-500">Public</span>
                )}
                {board.permission === 'owner' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(board._id);
                    }}
                    className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

