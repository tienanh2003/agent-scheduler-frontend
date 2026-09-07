'use client';

import React, { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, Column as ColumnType } from '@/types';
import { useTaskStore } from '@/store';
import { COLUMNS, COLUMN_CONFIG, COLUMNS_ARRAY, type ColumnId } from '@/constants';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({ onTaskClick }: KanbanBoardProps) {
  // Use selector to only subscribe to tasks array
  const tasks = useTaskStore(state => state.tasks);
  const moveTask = useTaskStore(state => state.moveTask);

  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by column using constants
  const tasksByColumn = useMemo(() => {
    const grouped: Record<ColumnType, Task[]> = {
      [COLUMNS.TODO]: [],
      [COLUMNS.DOING]: [],
      [COLUMNS.REVIEW]: [],
      [COLUMNS.DONE]: [],
      [COLUMNS.ERROR]: [],
    };

    tasks.forEach(task => {
      if (grouped[task.column]) {
        grouped[task.column].push(task);
      }
    });

    // Sort by position within each column
    Object.keys(grouped).forEach(column => {
      grouped[column as ColumnType].sort((a, b) => {
        const aPos = (a as { position?: number }).position ?? 0;
        const bPos = (b as { position?: number }).position ?? 0;
        return aPos - bPos;
      });
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Determine if dropping on a column or a task
    const isOverColumn = Object.values(COLUMNS).includes(overId as ColumnType);
    const overTask = tasks.find(t => t.id === overId);

    const targetColumn = isOverColumn
      ? overId as ColumnType
      : overTask?.column;

    if (targetColumn && targetColumn !== activeTask.column) {
      // Will be handled in dragEnd
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Determine target column
    const isOverColumn = Object.values(COLUMNS).includes(overId as ColumnType);
    const overTask = tasks.find(t => t.id === overId);

    let targetColumn: ColumnType | null = null;
    let targetPosition: number | undefined;

    if (isOverColumn) {
      targetColumn = overId as ColumnType;
    } else if (overTask) {
      targetColumn = overTask.column;
    }

    if (targetColumn && targetColumn !== activeTask.column) {
      try {
        await moveTask(activeId, targetColumn, targetPosition);
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-64px)]">
        {COLUMNS_ARRAY.map((columnConfig) => (
          <Column
            key={columnConfig.id}
            column={columnConfig}
            tasks={tasksByColumn[columnConfig.id]}
            onTaskClick={onTaskClick || (() => {})}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[280px]">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
