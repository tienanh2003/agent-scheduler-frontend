'use client';

import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { taskApi } from '@/lib/api';
import { useTaskStore } from '@/store';
import { LABEL_VALUES, type Label, type Priority } from '@/types';
import { getLabelClass, getPriorityClass } from '@/lib/utils';
import clsx from 'clsx';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTaskId?: string;
}

export function CreateTaskModal({ isOpen, onClose, parentTaskId }: CreateTaskModalProps) {
  // Only subscribe to addTask action
  const addTask = useTaskStore(state => state.addTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');
  const [autoStart, setAutoStart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (selectedLabels.length === 0) {
      setError('At least one label is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const task = await taskApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        labels: selectedLabels,
        priority,
        reviewEnabled,
        scheduledAt: scheduledAt || undefined,
        autoStart,
        parentTaskId,
      });

      addTask(task);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedLabels([]);
    setPriority('medium');
    setReviewEnabled(true);
    setScheduledAt('');
    setAutoStart(false);
    setError('');
    onClose();
  };

  const toggleLabel = (label: Label) => {
    setSelectedLabels(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {parentTaskId ? 'Create Sub-task' : 'Create Task'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter task description (supports markdown)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Execution Stages (Labels) *
            </label>
            <div className="flex flex-wrap gap-2">
              {LABEL_VALUES.map(label => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedLabels.includes(label)
                      ? getLabelClass(label) + ' ring-2 ring-offset-2 ring-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Tasks will execute in the order shown (left to right)
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={clsx(
                    'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                    priority === p
                      ? getPriorityClass(p as Priority)
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Review Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reviewEnabled"
              checked={reviewEnabled}
              onChange={e => setReviewEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <label htmlFor="reviewEnabled" className="text-sm text-gray-700 dark:text-gray-300">
              Enable review gate (requires approval before completion)
            </label>
          </div>

          {/* Scheduling */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoStart"
                checked={autoStart}
                onChange={e => setAutoStart(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <label htmlFor="autoStart" className="text-sm text-gray-700 dark:text-gray-300">
                Auto-start at scheduled time
              </label>
            </div>

            {autoStart && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

