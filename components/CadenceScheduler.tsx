'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { parseCadence, formatCadence, CadencePattern } from '@/lib/scheduling/cadenceParser';

interface CadenceSchedulerProps {
  onCadenceSelect: (pattern: CadencePattern) => void;
  initialPattern?: any;
}

export default function CadenceScheduler({
  onCadenceSelect,
  initialPattern,
}: CadenceSchedulerProps) {
  const [cadenceInput, setCadenceInput] = useState('');
  const [selectedType, setSelectedType] = useState<'simple' | 'cadence'>('simple');
  const [pattern, setPattern] = useState<CadencePattern>({
    type: 'weekly',
    interval: 1,
    dayOfWeek: 1,
  });

  const handleCadenceInput = (input: string) => {
    setCadenceInput(input);
    const parsed = parseCadence(input);
    if (parsed) {
      setPattern(parsed);
      onCadenceSelect(parsed);
    }
  };

  const handleSimpleChange = (field: string, value: any) => {
    const newPattern = { ...pattern, [field]: value };
    setPattern(newPattern);
    onCadenceSelect(newPattern);
  };

  const presetCadences = [
    'first monday',
    'last friday',
    'second tuesday',
    'third wednesday',
    'fourth thursday',
    'every 2nd monday',
    'every 3rd friday',
  ];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Schedule Type
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="simple"
              checked={selectedType === 'simple'}
              onChange={() => setSelectedType('simple')}
              className="mr-2"
            />
            Simple
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="cadence"
              checked={selectedType === 'cadence'}
              onChange={() => setSelectedType('cadence')}
              className="mr-2"
            />
            Cadence
          </label>
        </div>
      </div>

      {selectedType === 'simple' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={pattern.type}
              onChange={(e) => handleSimpleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {pattern.type === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Week
              </label>
              <select
                value={pattern.dayOfWeek || 1}
                onChange={(e) => handleSimpleChange('dayOfWeek', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          )}

          {pattern.type === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interval (every N weeks)
              </label>
              <input
                type="number"
                min="1"
                value={pattern.interval || 1}
                onChange={(e) => handleSimpleChange('interval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {pattern.type === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={pattern.dayOfMonth || 1}
                onChange={(e) => handleSimpleChange('dayOfMonth', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cadence (e.g., "first monday", "last friday")
            </label>
            <input
              type="text"
              value={cadenceInput}
              onChange={(e) => handleCadenceInput(e.target.value)}
              placeholder="first monday"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {pattern.cadence && (
              <p className="mt-2 text-sm text-green-600 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                Parsed: {formatCadence(pattern)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preset Cadences
            </label>
            <div className="flex flex-wrap gap-2">
              {presetCadences.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleCadenceInput(preset)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {pattern.cadence && (
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-medium text-blue-900">
            Schedule: {formatCadence(pattern)}
          </p>
        </div>
      )}
    </div>
  );
}

