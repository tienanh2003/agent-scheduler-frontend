'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Task } from '@/types';
import clsx from 'clsx';

interface ChildTasksProps {
  parentId: string;
  childTasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddChild?: () => void;
}

export function ChildTasks({
  childTasks,
  onTaskClick,
  onAddChild,
}: ChildTasksProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = (task: Task) => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const completedCount = childTasks.filter(t => t.status === 'completed').length;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sub-tasks ({completedCount}/{childTasks.length})
          </span>
        </div>

        {onAddChild && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </button>

      {/* Child task list */}
      {isExpanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {childTasks.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No sub-tasks
            </div>
          ) : (
            childTasks.map((child) => (
              <button
                key={child.id}
                onClick={() => onTaskClick(child)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
              >
                {getStatusIcon(child)}

                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    'text-sm truncate',
                    child.status === 'completed' && 'text-gray-500 line-through'
                  )}>
                    {child.title}
                  </p>
                  {child.status === 'running' && child.progress > 0 && (
                    <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${child.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <span className={clsx(
                  'px-1.5 py-0.5 text-xs rounded',
                  child.column === 'done' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  child.column === 'doing' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  child.column === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  child.column === 'todo' && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}>
                  {child.column}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
