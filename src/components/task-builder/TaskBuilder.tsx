'use client';

import { useState } from 'react';
import { Play, Clock, Shield } from 'lucide-react';
import {
  LABELS,
  LABEL_CONFIG,
  PERMISSION_PROFILE,
  PERMISSION_PROFILE_CONFIG,
  UI_STRINGS,
} from '@/constants';
import { taskApi } from '@/lib/api';
import type { Label, Task } from '@/types';

interface TaskBuilderProps {
  onSave?: (task: Task) => void;
  onRunNow?: (task: Task) => void;
}

export default function TaskBuilder({ onSave, onRunNow }: TaskBuilderProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [permissionProfile, setPermissionProfile] = useState<'safe' | 'code' | 'full'>('code');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLabel = (labelId: Label) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const createTaskPayload = () => ({
    title,
    description,
    labels: selectedLabels,
    ...(isScheduled && scheduledAt ? { scheduledAt } : {}),
    autoStart: false,
    reviewEnabled: true,
  });

  const handleSaveToBoard = async () => {
    if (!title.trim()) {
      alert(UI_STRINGS.ENTER_TASK_TITLE);
      return;
    }
    if (selectedLabels.length === 0) {
      alert(UI_STRINGS.SELECT_AT_LEAST_ONE_AGENT);
      return;
    }

    setIsSubmitting(true);
    try {
      const task = await taskApi.create(createTaskPayload());

      onSave?.(task);

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedLabels([]);
      setPermissionProfile('code');
      setIsScheduled(false);
      setScheduledAt('');
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunNow = async () => {
    if (!title.trim()) {
      alert(UI_STRINGS.ENTER_TASK_TITLE);
      return;
    }
    if (selectedLabels.length === 0) {
      alert(UI_STRINGS.SELECT_AT_LEAST_ONE_AGENT);
      return;
    }

    setIsSubmitting(true);
    try {
      const task = await taskApi.create(createTaskPayload());
      const startedTask = await taskApi.start(task.id);

      // Notify parent
      onRunNow?.(startedTask);

      // Show feedback
      alert(`Task "${startedTask.title}" is now running! The agent will start processing shortly.`);

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedLabels([]);
      setPermissionProfile('code');
      setIsScheduled(false);
      setScheduledAt('');
    } catch (error) {
      console.error('Failed to run task:', error);
      alert('Failed to start task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{UI_STRINGS.CREATE_NEW_TASK}</h2>

      {/* Title Input */}
      <div className="mb-5">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          {UI_STRINGS.TASK_TITLE}
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
      </div>

      {/* Description Textarea */}
      <div className="mb-5">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          {UI_STRINGS.DESCRIPTION}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the task in detail..."
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
        />
      </div>

      {/* Label/Agent Selection */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {UI_STRINGS.SELECT_AGENTS}
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LABEL_CONFIG).map(([labelId, config]) => (
            <button
              key={labelId}
              type="button"
              onClick={() => toggleLabel(labelId as Label)}
              className={`px-4 py-2 rounded-full border-2 font-medium text-sm transition-all duration-200 ${
                selectedLabels.includes(labelId as Label)
                  ? `${config.color} border-current ring-2 ring-offset-1 ring-gray-200`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
        {selectedLabels.length > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            {UI_STRINGS.SELECTED_AGENTS}: {selectedLabels.length} {UI_STRINGS.AGENTS}
          </p>
        )}
      </div>

      {/* Permission Profile Selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Shield className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
          {UI_STRINGS.PERMISSION_PROFILE}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(PERMISSION_PROFILE_CONFIG).map(([profileId, config]) => (
            <button
              key={profileId}
              type="button"
              onClick={() => setPermissionProfile(profileId as 'safe' | 'code' | 'full')}
              className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                permissionProfile === profileId
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <Shield
                className={`w-6 h-6 mx-auto mb-2 ${
                  permissionProfile === profileId ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <p className={`font-semibold ${permissionProfile === profileId ? 'text-blue-900' : 'text-gray-700'}`}>
                {config.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Clock className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            {UI_STRINGS.SCHEDULE_FOR_LATER}
          </label>
          <button
            type="button"
            onClick={() => setIsScheduled(!isScheduled)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              isScheduled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                isScheduled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {isScheduled && (
          <div className="mt-3 animate-fadeIn">
            <label htmlFor="schedule" className="block text-sm text-gray-600 mb-2">
              Select Date & Time
            </label>
            <input
              type="datetime-local"
              id="schedule"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSaveToBoard}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {UI_STRINGS.SAVE_TO_BOARD}
        </button>
        <button
          type="button"
          onClick={handleRunNow}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          {UI_STRINGS.RUN_NOW}
        </button>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
