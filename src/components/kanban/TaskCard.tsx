'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import type { Task } from '@/types';
import { getLabelClass, formatDate } from '../../lib/utils';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task }
  });

  const [isDraggingSelf, setIsDraggingSelf] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExecuting = task.status === 'running' || task.column === 'doing';
  const hasError = task.column === 'error' || task.status === 'error';
  const isInReview = task.column === 'review';

  const handleClick = (e: React.MouseEvent) => {
    if (!isDraggingSelf && onClick) {
      onClick();
    }
  };

  const handleDragStart = () => {
    setIsDraggingSelf(true);
  };

  const handleDragEnd = () => {
    setIsDraggingSelf(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'task-card p-3 group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow',
        (isSortableDragging || isDragging) && 'opacity-50 shadow-lg scale-105 rotate-1',
        hasError && 'border-l-4 border-l-red-500',
        isInReview && 'border-l-4 border-l-purple-500',
        isExecuting && 'border-l-4 border-l-yellow-500'
      )}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          className="mt-1 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          {...attributes}
          {...listeners}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
            {task.title}
          </h3>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.slice(0, 3).map((label) => (
                <span
                  key={label}
                  className={clsx(
                    'px-1.5 py-0.5 text-xs rounded font-medium',
                    getLabelClass(label)
                  )}
                >
                  {label}
                </span>
              ))}
              {task.labels && task.labels.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  +{task.labels.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Progress bar (when executing) */}
          {isExecuting && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {task.progress}%
                </span>
                {task.currentAgent && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    {task.currentAgent}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            {/* Child tasks indicator */}
            {task.childTasks && task.childTasks.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ChevronRight className="w-3 h-3" />
                {task.childTasks.length} subtasks
              </div>
            )}

            {/* Error indicator */}
            {hasError && task.error && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="w-3 h-3" />
                Error
              </div>
            )}

            {/* Scheduled indicator */}
            {task.scheduledAt && task.column === 'todo' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatDate(task.scheduledAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
