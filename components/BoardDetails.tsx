'use client';

import { useState, useEffect } from 'react';
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import { BoardPermission } from '@/lib/models/Board';

interface Board {
  _id: string;
  name: string;
  description?: string;
  color: string;
  isPublic: boolean;
  permission: string;
}

interface Member {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  permission: string;
  joinedAt: string;
}

interface BoardDetailsProps {
  board: Board;
  onBack: () => void;
  onUpdate: () => void;
}

export default function BoardDetails({ board, onBack, onUpdate }: BoardDetailsProps) {
  const [boardDetails, setBoardDetails] = useState(board);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [userPermission, setUserPermission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    email: '',
    permission: BoardPermission.MEMBER,
  });

  useEffect(() => {
    fetchBoardDetails();
    fetchTasks();
    fetchMembers();
  }, [board._id]);

  const fetchBoardDetails = async () => {
    try {
      const res = await fetch(`/api/boards/${board._id}`);
      const data = await res.json();
      setBoardDetails(data.board);
      setUserPermission(data.userPermission);
    } catch (error) {
      console.error('Failed to fetch board details:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?boardId=${board._id}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/boards/${board._id}/members`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleTaskCreated = (newTask: any) => {
    setTasks([newTask, ...tasks]);
  };

  const handleTaskUpdated = (updatedTask: any) => {
    setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter((t) => t._id !== taskId));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/boards/${board._id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberFormData),
      });

      if (!res.ok) throw new Error('Failed to add member');

      await fetchMembers();
      setShowMemberForm(false);
      setMemberFormData({ email: '', permission: BoardPermission.MEMBER });
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const handleUpdateMemberPermission = async (memberId: string, permission: string) => {
    try {
      const res = await fetch(`/api/boards/${board._id}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      });

      if (!res.ok) throw new Error('Failed to update member');

      await fetchMembers();
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('Failed to update member. Please try again.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const res = await fetch(`/api/boards/${board._id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove member');

      await fetchMembers();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const canManageMembers = userPermission?.canManageMembers || false;
  const canEdit = userPermission?.canEdit || false;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div
            className="h-8 w-1 rounded"
            style={{ backgroundColor: boardDetails.color }}
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{boardDetails.name}</h2>
            {boardDetails.description && (
              <p className="text-sm text-gray-600">{boardDetails.description}</p>
            )}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded text-sm ${
            userPermission?.permission === 'owner'
              ? 'bg-purple-100 text-purple-800'
              : userPermission?.permission === 'admin'
              ? 'bg-blue-100 text-blue-800'
              : userPermission?.permission === 'member'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {userPermission?.permission || 'viewer'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {canEdit ? (
            <TaskInput
              onTaskCreated={handleTaskCreated}
              boardId={board._id}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                You have view-only access. Only members with edit permissions can create tasks.
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : (
            <TaskList
              tasks={tasks}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              canEdit={canEdit}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Members</h3>
              {canManageMembers && (
                <button
                  onClick={() => setShowMemberForm(!showMemberForm)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showMemberForm ? 'Cancel' : '+ Add'}
                </button>
              )}
            </div>

            {showMemberForm && canManageMembers && (
              <form onSubmit={handleAddMember} className="mb-4 space-y-2">
                <input
                  type="email"
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                <select
                  value={memberFormData.permission}
                  onChange={(e) => setMemberFormData({ ...memberFormData, permission: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value={BoardPermission.VIEWER}>Viewer</option>
                  <option value={BoardPermission.MEMBER}>Member</option>
                  <option value={BoardPermission.ADMIN}>Admin</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-3 text-sm rounded-md hover:bg-blue-700"
                >
                  Add Member
                </button>
              </form>
            )}

            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2 bg-white rounded"
                >
                  <div className="flex items-center space-x-2">
                    {member.userId.image && (
                      <img
                        src={member.userId.image}
                        alt={member.userId.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.userId.name}
                      </p>
                      <p className="text-xs text-gray-500">{member.userId.email}</p>
                    </div>
                  </div>
                  {canManageMembers && member.permission !== BoardPermission.OWNER && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.permission}
                        onChange={(e) =>
                          handleUpdateMemberPermission(member._id, e.target.value)
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value={BoardPermission.VIEWER}>Viewer</option>
                        <option value={BoardPermission.MEMBER}>Member</option>
                        <option value={BoardPermission.ADMIN}>Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {!canManageMembers && (
                    <span className="text-xs text-gray-500">{member.permission}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

