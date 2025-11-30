'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Inbox, Calendar, CalendarDays, CheckSquare2, Tag, Users, LayoutGrid, Folder, Settings, Link, ChevronDown, ChevronRight, Plus } from 'lucide-react';

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
  const [showProjects, setShowProjects] = useState(true);

  const navigationItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: taskCounts?.inbox },
    { id: 'today', label: 'Today', icon: Calendar, count: taskCounts?.today },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, count: taskCounts?.upcoming },
    { id: 'list', label: 'All Tasks', icon: CheckSquare2, count: undefined },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white font-semibold">
            {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => onViewChange('list')}
          className="w-full text-white rounded-lg py-2.5 px-4 flex items-center justify-center space-x-2 font-medium transition-colors shadow-sm"
          style={{
            backgroundColor: 'var(--primary-color)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-color-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-color)';
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="px-2 space-y-1">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full sidebar-item ${
                  currentView === item.id ? 'sidebar-item-active' : ''
                }`}
              >
                <IconComponent className="w-5 h-5 mr-3" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Filters & Labels */}
        <div className="px-2 mt-4">
          <button
            onClick={() => onViewChange('filters')}
            className="w-full sidebar-item"
          >
            <Tag className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">Filters & Labels</span>
          </button>
        </div>

        {/* Kanban Board View */}
        <div className="px-2 mt-4">
          <button
            onClick={() => onViewChange('kanban')}
            className={`w-full sidebar-item ${
              currentView === 'kanban' ? 'sidebar-item-active' : ''
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">People</span>
          </button>
        </div>

        {/* Projects Section */}
        <div className="px-2 mt-4">
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </h3>
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showProjects ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          {showProjects && (
            <div className="mt-1 space-y-1">
              <button
                onClick={() => onViewChange('boards')}
                className="w-full sidebar-item pl-8"
              >
                <LayoutGrid className="w-5 h-5 mr-3" />
                <span className="flex-1 text-left">Boards</span>
              </button>
              <button
                onClick={() => onViewChange('categories')}
                className="w-full sidebar-item pl-8"
              >
                <Folder className="w-5 h-5 mr-3" />
                <span className="flex-1 text-left">Categories</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => onViewChange('settings')}
          className="w-full sidebar-item"
        >
          <Settings className="w-5 h-5 mr-3" />
          <span className="flex-1 text-left">Settings</span>
        </button>
        <button
          onClick={() => onViewChange('webhooks')}
          className="w-full sidebar-item"
        >
          <Link className="w-5 h-5 mr-3" />
          <span className="flex-1 text-left">Webhooks</span>
        </button>
      </div>
    </div>
  );
}

