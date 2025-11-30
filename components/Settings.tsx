'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Preferences {
  defaultPriority: string;
  workHours: { start: number; end: number };
  preferredDays: number[];
  autoTagging: boolean;
  smartScheduling: boolean;
  mlLearning: boolean;
  primaryColor: string;
  notificationSettings: {
    email: boolean;
    push: boolean;
    reminderBeforeDue: number;
  };
}

export default function Settings() {
  const { primaryColor, setPrimaryColor } = useTheme();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/preferences');
      const data = await res.json();
      const prefs = data.preferences || {};
      setPreferences(prefs);
      if (prefs.primaryColor) {
        setPrimaryColor(prefs.primaryColor);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          primaryColor: primaryColor,
        }),
      });

      if (!res.ok) throw new Error('Failed to save preferences');

      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="text-center py-8">Failed to load preferences</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings & Preferences</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Priority
          </label>
          <select
            value={preferences.defaultPriority}
            onChange={(e) =>
              setPreferences({ ...preferences, defaultPriority: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Hours
          </label>
          <div className="flex space-x-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start</label>
              <input
                type="number"
                min="0"
                max="23"
                value={preferences.workHours.start}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    workHours: { ...preferences.workHours, start: parseInt(e.target.value) },
                  })
                }
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End</label>
              <input
                type="number"
                min="0"
                max="23"
                value={preferences.workHours.end}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    workHours: { ...preferences.workHours, end: parseInt(e.target.value) },
                  })
                }
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.autoTagging}
                onChange={(e) =>
                  setPreferences({ ...preferences, autoTagging: e.target.checked })
                }
                className="mr-2"
              />
              <span>Auto Tagging</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.smartScheduling}
                onChange={(e) =>
                  setPreferences({ ...preferences, smartScheduling: e.target.checked })
                }
                className="mr-2"
              />
              <span>Smart Scheduling</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.mlLearning}
                onChange={(e) =>
                  setPreferences({ ...preferences, mlLearning: e.target.checked })
                }
                className="mr-2"
              />
              <span>Machine Learning Pattern Recognition</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => {
                setPrimaryColor(e.target.value);
                if (preferences) {
                  setPreferences({ ...preferences, primaryColor: e.target.value });
                }
              }}
              className="w-20 h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
            <div className="flex-1">
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    setPrimaryColor(e.target.value);
                    if (preferences) {
                      setPreferences({ ...preferences, primaryColor: e.target.value });
                    }
                  }
                }}
                placeholder="#3b82f6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose your primary theme color
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <div className="flex space-x-2">
              {['#3b82f6', '#e91e63', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setPrimaryColor(color);
                    if (preferences) {
                      setPreferences({ ...preferences, primaryColor: color });
                    }
                  }}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">Quick picks</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notifications
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notificationSettings.email}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notificationSettings: {
                      ...preferences.notificationSettings,
                      email: e.target.checked,
                    },
                  })
                }
                className="mr-2"
              />
              <span>Email Notifications</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notificationSettings.push}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notificationSettings: {
                      ...preferences.notificationSettings,
                      push: e.target.checked,
                    },
                  })
                }
                className="mr-2"
              />
              <span>Push Notifications</span>
            </label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Reminder Before Due (hours)
              </label>
              <input
                type="number"
                min="0"
                value={preferences.notificationSettings.reminderBeforeDue}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notificationSettings: {
                      ...preferences.notificationSettings,
                      reminderBeforeDue: parseInt(e.target.value),
                    },
                  })
                }
                className="w-32 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full text-white py-2.5 px-4 rounded-lg disabled:opacity-50 font-medium transition-colors"
          style={{
            backgroundColor: 'var(--primary-color)',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'var(--primary-color-hover)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-color)';
          }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

