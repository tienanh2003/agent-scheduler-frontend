'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/types';
import { COLUMN_CONFIG, type ColumnId } from '@/constants';
import { TaskCard } from './TaskCard';
import clsx from 'clsx';

// Column configuration type
export interface ColumnConfig {
  id: ColumnId;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  chipClass: string;
}

interface ColumnProps {
  column: ColumnConfig;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function Column({ column, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id }
  });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      {/* Column Header */}
      <div
        className={clsx(
          'column-header rounded-t-lg',
          column.bgColor,
        )}
        style={{ color: column.color }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span>{column.title}</span>
          <span className="text-sm opacity-75">({tasks.length})</span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 p-2 space-y-2 rounded-b-lg border-2 border-t-0 min-h-[200px]',
          column.borderColor,
          isOver && 'bg-blue-50 dark:bg-blue-900/20 border-dashed'
        )}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
