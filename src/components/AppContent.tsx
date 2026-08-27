'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Task } from '@/types';
import { useTaskStore } from '@/store';
import { socket } from '@/lib/socket';
import { setupSocketListeners } from '@/store';

const KanbanBoard = dynamic(
  () => import('@/components/kanban/KanbanBoard').then(mod => mod.KanbanBoard),
  { ssr: false }
);

const CreateTaskModal = dynamic(
  () => import('@/components/modals/CreateTaskModal').then(mod => mod.CreateTaskModal),
  { ssr: false }
);

const TaskDetailPanel = dynamic(
  () => import('@/components/task-detail/TaskDetailPanel').then(mod => mod.TaskDetailPanel),
  { ssr: false }
);

const Header = dynamic(
  () => import('@/components/layout/Header').then(mod => mod.Header),
  { ssr: false }
);

function LoadingSkeleton() {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-[280px] max-w-[320px] flex-1">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-b-lg border-2 border-t-0 border-gray-200 dark:border-gray-700 p-2 space-y-2">
            {[1, 2].map((j) => (
              <div key={j} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AppContent() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only subscribe to specific state pieces
  const tasks = useTaskStore(s => s.tasks);
  const isLoading = useTaskStore(s => s.isLoading);
  const error = useTaskStore(s => s.error);

  // Use getState for one-time actions
  useEffect(() => {
    setMounted(true);
    useTaskStore.getState().fetchTasks();

    // Setup socket and connect
    setupSocketListeners();
    socket.connect();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRetry = useCallback(() => {
    useTaskStore.getState().fetchTasks();
  }, []);

  const currentSelectedTask = selectedTask
    ? tasks.find(t => t.id === selectedTask.id) || selectedTask
    : null;

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        onNewTask={() => setIsCreateModalOpen(true)}
      />

      {isLoading && tasks.length === 0 && <LoadingSkeleton />}

      {error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-red-500">Error: {error}</div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <KanbanBoard onTaskClick={setSelectedTask} />
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {currentSelectedTask && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedTask(null)}
          />
          <TaskDetailPanel
            task={currentSelectedTask}
            onClose={() => setSelectedTask(null)}
          />
        </>
      )}
    </div>
  );
}
